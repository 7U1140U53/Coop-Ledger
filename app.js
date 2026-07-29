// ==========================================================
// 1. SUPABASE CLIENT CONFIGURATION
// ==========================================================
const SUPABASE_URL = window.SUPABASE_CONFIG.URL;
const SUPABASE_ANON_KEY = window.SUPABASE_CONFIG.ANON_KEY;
window.supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    db: { schema: "coop_ledger" },
  },
);

// ==========================================================
// DEBUG UTILITIES
// ==========================================================

const DEBUG = false;

function debug(...args) {
  if (DEBUG) {
    console.log(...args);
  }
}

// ==========================================================
// 2. GLOBAL STATE MATRIX WITH CONTEXT-DRIVEN ROLES
// ==========================================================
const urlParams = new URLSearchParams(window.location.search);
let urlGroupId = urlParams.get("group") || null;

const state = {
  sessionUser: null,
  userProfile: null,
  userCirclesList: [],
  currentGroup: {
    id: urlGroupId,
    name: "Select a circle",
    contributionAmount: 50000,
    currentRound: 1,
    createdBy: null,
    description: "",
  },
  effectiveRole: "MEMBER",

  authMode: "login",
};

// ==========================================================
// 3. APPLICATION INITIATION & AUTHENTICATION LISTENERS
// ==========================================================
document.addEventListener("DOMContentLoaded", () => {
  showLoginMode();

  initAuthListeners();
  setupFormHandlers();
  setupPasswordToggle();
});

function resetAuthUI() {
  const submitBtn = document.getElementById("btn-auth-submit");
  const switchBtn = document.getElementById("btn-auth-switch");
  const emailInput = document.getElementById("auth-email");
  const passwordInput = document.getElementById("auth-password");

  showLoginMode();

  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.classList.remove("opacity-50", "cursor-not-allowed");
  }

  if (switchBtn) {
    switchBtn.disabled = false;
    switchBtn.classList.remove("opacity-50", "cursor-not-allowed");
  }

  if (emailInput) emailInput.value = "";
  if (passwordInput) passwordInput.value = "";
}

function initAuthListeners() {
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (session) {
      state.sessionUser = session.user;

      await syncUserProfileAndGroupRole();

      renderAuthBadge();

      toggleView("DASHBOARD");
    } else {
      state.sessionUser = null;
      state.userProfile = null;
      state.userCirclesList = [];
      state.currentGroup = {
        id: urlGroupId,
        name: "Select a circle",
        contributionAmount: 50000,
        currentRound: 1,
        createdBy: null,
        description: "",
      };

      resetAuthUI();

      renderAuthBadge();

      toggleView("AUTH");
    }
  });
}

// ==========================================================
// 4. CONTEXTUAL ROLE RECALCULATOR & MEMBERSHIP ENGAGEMENT
// ==========================================================
async function syncUserProfileAndGroupRole() {
  try {
    if (!state.sessionUser) return;

    // ------------------------------------------
    // Load or create the user's profile
    // ------------------------------------------
    let { data: profile } = await supabase
      .from("coop_profiles")
      .select("*")
      .eq("id", state.sessionUser.id)
      .maybeSingle();

    if (!profile) {
      const tempName = state.sessionUser.email.split("@")[0].toUpperCase();

      const { data: newProfile, error: profileInsertError } = await supabase
        .from("coop_profiles")
        .insert([
          {
            id: state.sessionUser.id,
            full_name: tempName,
            role: "MEMBER",
          },
        ])
        .select()
        .single();

      if (profileInsertError) {
        throw profileInsertError;
      }

      profile = newProfile;
    }

    state.userProfile = profile;

    // ------------------------------------------
    // Automatically join the group when visiting
    // an invite link
    // ------------------------------------------
    if (state.currentGroup.id) {
      const { data, error } = await supabase
        .from("coop_group_members")
        .upsert(
          [
            {
              group_id: state.currentGroup.id,
              user_id: state.sessionUser.id,
            },
          ],
          {
            onConflict: "group_id,user_id",
            ignoreDuplicates: true,
          },
        )
        .select();
    }

    // ------------------------------------------
    // Load user's circles
    // ------------------------------------------
    await fetchIsolateWorkspaces();

    // User has no circles.
    // Clear any stale invite URL and reset the current group.
    if (state.userCirclesList.length === 0) {
      state.currentGroup.id = null;
      urlGroupId = null;

      window.history.replaceState({}, "", window.location.pathname);
    }

    // User belongs to circles but none is currently selected.
    else if (!state.currentGroup.id) {
      state.currentGroup.id = state.userCirclesList[0].id;
    }

    // ------------------------------------------
    // Load current group
    // ------------------------------------------
    if (state.currentGroup.id) {
      const { data: groupData } = await supabase
        .from("coop_groups")
        .select("*")
        .eq("id", state.currentGroup.id)
        .maybeSingle();

      if (groupData && !groupData.is_archived) {
        state.currentGroup.name = groupData.group_name;
        state.currentGroup.contributionAmount = groupData.contribution_amount;
        state.currentGroup.currentRound = groupData.current_round;
        state.currentGroup.createdBy = groupData.created_by;
        state.currentGroup.description =
          groupData.description || "No description set.";

        state.effectiveRole =
          groupData.created_by === state.sessionUser.id
            ? "TREASURER"
            : "MEMBER";
      } else {
        state.currentGroup.id = null;
        state.effectiveRole = "MEMBER";
      }
    }

    // ------------------------------------------
    // Show / hide Treasurer controls
    // ------------------------------------------
    if (state.effectiveRole === "TREASURER") {
      document.getElementById("tab-audit")?.classList.remove("hidden");

      document
        .getElementById("treasurer-settings-block")
        ?.classList.remove("hidden");

      document.getElementById("group-config-panel")?.classList.remove("hidden");

      const nameField = document.getElementById("edit-group-name");
      const amtField = document.getElementById("edit-group-amount");
      const descField = document.getElementById("edit-group-desc");

      if (nameField) {
        nameField.value = state.currentGroup.name;
      }

      if (amtField) {
        amtField.value = state.currentGroup.contributionAmount;
      }

      if (descField) {
        descField.value = state.currentGroup.description;
      }
    } else {
      document.getElementById("tab-audit")?.classList.add("hidden");

      document
        .getElementById("treasurer-settings-block")
        ?.classList.add("hidden");

      document.getElementById("group-config-panel")?.classList.add("hidden");
    }

    // ------------------------------------------
    // Populate profile settings
    // ------------------------------------------
    const profileNameField = document.getElementById("settings-profile-name");

    if (profileNameField) {
      profileNameField.value = state.userProfile.full_name || "";
    }

    // ------------------------------------------
    // Refresh UI
    // ------------------------------------------
    renderAuthBadge();
    renderCirclesHubDeck();
    await renderInterfacePanels();
    executeAjoEnginePipeline();
  } catch (err) {
    console.error("Profile Synchronization Error:", err);
  }
}

// ==========================================================
// 5. STABLE WORKSPACE DISCOVERY LOGIC (JUNCTION-BASED)
// ==========================================================
async function fetchIsolateWorkspaces() {
  try {
    const { data: membershipRecords, error: memberError } = await supabase
      .from("coop_group_members")
      .select("group_id")
      .eq("user_id", state.sessionUser.id);

    if (memberError) throw memberError;

    if (!membershipRecords || membershipRecords.length === 0) {
      state.userCirclesList = [];
      return;
    }

    const joinedGroupIds = membershipRecords.map((record) => record.group_id);

    const { data: crossFilteredGroups, error: groupError } = await supabase
      .from("coop_groups")
      .select("*")
      .in("id", joinedGroupIds)
      .eq("is_archived", false)
      .order("created_at", { ascending: false });

    if (groupError) throw groupError;

    state.userCirclesList = crossFilteredGroups || [];
  } catch (err) {
    console.error("Workspace Filtering Failure:", err.message);
  }
}

// ==========================================================
// 6. LAYOUT ENGINE CONTROLLER
// ==========================================================
function renderCirclesHubDeck() {
  const grid = document.getElementById("circles-directory-grid");
  if (!grid) return;

  if (state.userCirclesList.length === 0) {
    grid.innerHTML = `
    <div class="col-span-full rounded-2xl border border-dashed border-slate-700 bg-slate-900/30 p-8 text-center">
        <div class="max-w-md mx-auto space-y-4">
            <div class="text-3xl">👋</div>

            <h3 class="text-lg font-bold text-white">
                Welcome to Coop Ledger
            </h3>

            <p class="text-sm text-slate-400 leading-relaxed">
                You're not a member of any cooperative circles yet.
                Create your first circle to get started or join one using an invitation link from another member.
            </p>

            <button
                onclick="handleCreateGroupWizard()"
                class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition"
            >
                ➕ Create Your First Circle
            </button>
        </div>
    </div>
  `;
    return;
  }

  let cardsHtml = state.userCirclesList
    .map((group, index) => {
      const isCurrent = group.id === state.currentGroup.id;
      const isOwner = group.created_by === state.sessionUser.id;
      const responsiveClass = index >= 3 ? "lg:hidden" : "";

      return `
            <div onclick="switchCircleWorkspace('${group.id}')" 
                class="${responsiveClass} snap-start shrink-0 min-w-[85%] sm:min-w-[48%] lg:min-w-0 h-20 p-3.5 rounded-xl border transition flex flex-col justify-between shadow-sm cursor-pointer
                ${
                  isCurrent
                    ? "bg-slate-900 border-emerald-500/50 ring-1 ring-emerald-500/20 text-white"
                    : "bg-slate-950 hover:bg-slate-900/60 border-slate-800 text-slate-300 hover:text-white"
                }">
                <div class="flex justify-between items-start gap-2">
                    <h4 class="text-xs font-bold truncate max-w-[150px] tracking-wide">${group.group_name}</h4>
                    <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                        ₦${(group.contribution_amount || 0).toLocaleString()}
                    </span>
                </div>
                <div class="flex justify-between items-center text-[10px] font-medium">
                    <span class="text-slate-500">${isOwner ? "👑 Manager" : "🏃 Member"}</span>
                    ${isCurrent ? '<span class="text-emerald-400 font-bold flex items-center gap-1">● Active</span>' : '<span class="text-slate-500">View</span>'}
                </div>
            </div>
        `;
    })
    .join("");

  if (state.userCirclesList.length > 3) {
    const remainingCount = state.userCirclesList.length - 3;
    cardsHtml += `
            <div onclick="openCirclesDrawer()" 
                class="hidden lg:flex snap-start shrink-0 h-20 p-3.5 rounded-xl border border-dashed border-slate-800 bg-slate-900/40 hover:bg-slate-900 text-emerald-400 hover:text-emerald-300 items-center justify-center gap-2 transition cursor-pointer font-mono text-xs font-bold uppercase tracking-wider shadow-sm">
                <span>🗂️ View All (+${remainingCount})</span>
            </div>
        `;
  }

  grid.innerHTML = cardsHtml;
  renderDrawerCirclesList(state.userCirclesList);
}

function renderDrawerCirclesList(circles) {
  const drawerList = document.getElementById("drawer-circles-list");
  if (!drawerList) return;

  if (circles.length === 0) {
    drawerList.innerHTML = `<div class="text-xs text-slate-500 italic p-4 text-center font-mono">No circles found.</div>`;
    return;
  }

  drawerList.innerHTML = circles
    .map((group) => {
      const isCurrent = group.id === state.currentGroup.id;
      const isOwner = group.created_by === state.sessionUser.id;
      return `
            <div onclick="switchCircleWorkspace('${group.id}'); closeCirclesDrawer();" 
                class="p-3.5 rounded-xl border transition flex items-center justify-between cursor-pointer shadow-sm
                ${
                  isCurrent
                    ? "bg-slate-900 border-emerald-500/50 ring-1 ring-emerald-500/10"
                    : "bg-slate-950 hover:bg-slate-900/60 border-slate-800 text-slate-300 hover:text-white"
                }" >
                <div class="flex flex-col gap-0.5 truncate max-w-[70%]">
                    <h4 class="text-xs font-bold truncate tracking-wide text-slate-200">${group.group_name}</h4>
                    <span class="text-[10px] text-slate-500 font-medium">${isOwner ? "👑 Manager" : "🏃 Member"}</span>
                </div>
                <div class="text-right flex flex-col items-end gap-1 font-mono shrink-0">
                    <span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                        ₦${(group.contribution_amount || 0).toLocaleString()}
                    </span>
                    ${isCurrent ? '<span class="text-emerald-400 font-bold text-[9px] uppercase tracking-widest">● Active</span>' : ""}
                </div>
            </div>
        `;
    })
    .join("");
}

window.openCirclesDrawer = function () {
  const drawer = document.getElementById("circles-drawer");
  const backdrop = document.getElementById("circles-drawer-backdrop");
  if (drawer && backdrop) {
    backdrop.classList.remove("opacity-0", "pointer-events-none");
    backdrop.classList.add("opacity-100");
    drawer.classList.remove("translate-x-full");
  }
  const searchInput = document.getElementById("drawer-search-input");
  if (searchInput) searchInput.value = "";
  renderDrawerCirclesList(state.userCirclesList);
};

window.closeCirclesDrawer = function () {
  const drawer = document.getElementById("circles-drawer");
  const backdrop = document.getElementById("circles-drawer-backdrop");
  if (drawer && backdrop) {
    backdrop.classList.remove("opacity-100");
    backdrop.classList.add("opacity-0", "pointer-events-none");
    drawer.classList.add("translate-x-full");
  }
};

window.filterDrawerCircles = function () {
  const searchVal =
    document
      .getElementById("drawer-search-input")
      ?.value.toLowerCase()
      .trim() || "";
  const filtered = state.userCirclesList.filter((group) =>
    group.group_name.toLowerCase().includes(searchVal),
  );
  renderDrawerCirclesList(filtered);
};

async function switchCircleWorkspace(targetGroupId) {
  state.currentGroup.id = targetGroupId;
  urlGroupId = targetGroupId;

  const newUrl = `${window.location.origin}${window.location.pathname}?group=${targetGroupId}`;
  window.history.pushState({ path: newUrl }, "", newUrl);

  switchSubView("overview");
  await syncUserProfileAndGroupRole();
}

// ==========================================================
// 7. PIPELINE COMPILATION
// ==========================================================
async function executeAjoEnginePipeline() {
  try {
    if (!state.currentGroup.id) {
      renderGlobalAjoBanner("Select a circle", 0);
      return;
    }

    const displayTitle = document.getElementById("display-group-name");
    if (displayTitle) displayTitle.innerText = state.currentGroup.name;

    const displayDesc = document.getElementById("display-group-desc");
    if (displayDesc) displayDesc.innerText = state.currentGroup.description;

    const { data: contributions, error: txErr } = await supabase
      .from("coop_contributions")
      .select(
        `
                member_id, created_at, status, sender_account_name, amount,
                coop_profiles (full_name)
            `,
      )
      .eq("group_id", state.currentGroup.id)
      .eq("round_number", state.currentGroup.currentRound)
      .eq("status", "APPROVED")
      .order("created_at", { ascending: true });

    if (txErr) throw txErr;

    let electedCollector = "None this round";
    if (contributions && contributions.length > 0) {
      electedCollector =
        contributions[0].coop_profiles?.full_name ||
        contributions[0].sender_account_name ||
        "Member";
    }

    const totalPoolValueCollected = contributions
      ? contributions.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
      : 0;
    renderGlobalAjoBanner(electedCollector, totalPoolValueCollected);

    if (state.effectiveRole === "TREASURER") {
      await fetchAndRenderAuditFeed();
    }
  } catch (err) {
    console.error("Pipeline Computation Error:", err.message);
  }
}

// ==========================================================
// 8. INTERFACE PANEL HYDRATION (REFACETORED & FIXED)
// ==========================================================
async function renderInterfacePanels() {
  const mPanel = document.getElementById("member-panel");
  const txAmountInput = document.getElementById("tx-amount");
  const depositForm = document.getElementById("deposit-form");
  const depositStatusWrapper = document.getElementById(
    "deposit-status-wrapper",
  );
  const txRefInput = document.getElementById("tx-ref");
  const txBankInput = document.getElementById("tx-bank");

  if (!state.currentGroup.id) {
    if (mPanel) {
      if (state.userCirclesList.length === 0) {
        mPanel.innerHTML = `
        <div class="p-6 rounded-xl border border-dashed border-slate-800 bg-slate-900/20 text-center">
            <p class="text-sm text-slate-400">
                Your contribution activity will appear here once you join or create a cooperative circle.
            </p>
        </div>
      `;
      } else {
        mPanel.innerHTML = `
        <div class="p-6 text-center text-slate-500 italic w-full">
            Select a circle to view your contribution statistics.
        </div>
      `;
      }
    }

    return;
  }

  // Pull transaction logs first to check historical state parameters
  const { data: userLogs } = await supabase
    .from("coop_contributions")
    .select("status, payment_reference, sender_bank_name, amount, created_at")
    .eq("group_id", state.currentGroup.id)
    .eq("round_number", state.currentGroup.currentRound)
    .eq("member_id", state.sessionUser.id)
    .order("created_at", { ascending: false })
    .limit(1);

  const userLog = userLogs?.[0] ?? null;

  // CONTEXTUAL DISPLAY FIX: Isolates actual logged deposit sums from template updates
  if (txAmountInput) {
    const functionalDisplayAmount =
      userLog && userLog.amount
        ? userLog.amount
        : state.currentGroup.contributionAmount || 0;
    txAmountInput.value = `₦ ${functionalDisplayAmount.toLocaleString()}`;
  }

  if (userLog) {
    const contributionStatus = userLog.status;

    const badgeMap = {
      APPROVED: {
        label: "Approved",
        badge:
          "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
        icon: "🧾",
        heading: "Deposit verified",
        message: "Your deposit has been approved and added to the pool.",
        refColor: "text-emerald-400",
      },

      PENDING_VERIFICATION: {
        label: "Pending approval",
        badge: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
        icon: "⏳",
        heading: "Deposit pending",
        message: "Your payment reference is under review.",
        refColor: "text-amber-400",
      },

      REJECTED: {
        label: "Rejected",
        badge: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
        icon: "❌",
        heading: "Deposit rejected",
        message:
          "Your previous submission could not be verified. Please submit a new payment reference below.",
        refColor: "text-rose-400",
      },
    };

    const statusUI =
      badgeMap[contributionStatus] ?? badgeMap.PENDING_VERIFICATION;
    const displayRef = userLog.payment_reference || "N/A";
    const displayBank = userLog.sender_bank_name || "Direct Wire";
    const displayAmt = userLog.amount
      ? userLog.amount.toLocaleString()
      : (state.currentGroup.contributionAmount || 0).toLocaleString();
    const displayTime = userLog.created_at
      ? new Date(userLog.created_at).toLocaleTimeString()
      : new Date().toLocaleTimeString();

    if (mPanel) {
      mPanel.innerHTML = `
                <div class="border border-slate-800 bg-slate-900/20 rounded-xl p-5 space-y-4 animate-fade-in">
                    <div class="flex items-center justify-between border-b border-slate-900 pb-3">
                        <h3 class="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Your Status</h3>
                        <span class="text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${statusUI.badge}">
                        ● ${statusUI.label}
                        </span>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div class="bg-slate-950 p-3 rounded-lg border border-slate-900/60">
                            <span class="text-[10px] text-slate-500 block uppercase font-mono mb-1">Amount</span>
                            <span class="text-xs font-bold font-mono text-white">₦ ${displayAmt}</span>
                        </div>
                        <div class="bg-slate-950 p-3 rounded-lg border border-slate-900/60">
                            <span class="text-[10px] text-slate-500 block uppercase font-mono mb-1">Bank</span>
                            <span class="text-xs font-bold text-slate-300 font-mono">${displayBank}</span>
                        </div>
                        <div class="bg-slate-950 p-3 rounded-lg border border-slate-900/60">
                            <span class="text-[10px] text-slate-500 block uppercase font-mono mb-1">Reference</span>
                            <span class="text-xs font-mono font-bold ${statusUI.refColor} block truncate" title="${displayRef}">${displayRef}</span>
                        </div>
                    </div>
                    <div class="flex justify-between items-center text-[10px] text-slate-500 font-mono pt-1">
                        <span>Logged: ${displayTime}</span>
                        <span>Round: ${state.currentGroup.currentRound}</span>
                    </div>
                </div>
            `;
    }

    if (depositStatusWrapper) {
      depositStatusWrapper.innerHTML = `
                <div class="border border-dashed border-slate-800 bg-slate-900/30 rounded-xl p-6 text-center max-w-md mx-auto space-y-3 mb-6 animate-fade-in">
                    <div class="text-xl">${statusUI.icon}</div>
                    <h4 class="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                      ${statusUI.heading}
                    </h4>
                    <p class="text-xs text-slate-400 leading-relaxed">
                        ${statusUI.message}
                    </p>
                    <div class="inline-block bg-slate-950 px-3 py-1.5 rounded font-mono text-[11px] border border-slate-900 text-slate-400">
                        REF:<span class="${statusUI.refColor} font-bold">${displayRef} </span>
                    </div>
                </div>
            `;
    }

    if (depositForm) {
      depositForm.classList.remove("hidden");
      const submitBtn = depositForm.querySelector('button[type="submit"]');
      const isLocked = contributionStatus !== "REJECTED";
      if (submitBtn) {
        submitBtn.disabled = isLocked;
        if (isLocked) {
          submitBtn.innerText = "🔒 Locked for this round";
          submitBtn.className =
            "w-full bg-slate-800 text-slate-500 font-mono text-xs font-bold py-2.5 px-4 rounded-xl border border-slate-700 cursor-not-allowed transition";
        } else {
          submitBtn.innerText = "Submit New deposit";
          submitBtn.className =
            "w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition shadow-md shadow-emerald-900/10";
        }
      }
      if (txRefInput) {
        txRefInput.disabled = isLocked;
        if (!isLocked) txRefInput.value = "";
      }
      if (txBankInput) {
        txBankInput.disabled = isLocked;
        if (!isLocked) txBankInput.value = "";
      }
    }
  } else {
    if (mPanel) {
      mPanel.innerHTML = `
                <div class="p-4 text-center text-slate-400 bg-slate-900 border border-slate-800 rounded-xl w-full text-xs flex justify-between items-center flex-wrap gap-2">
                    <span>📣 You haven't made a deposit for Round ${state.currentGroup.currentRound}.</span>
                    <button onclick="switchSubView('deposit')" class="bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 font-mono text-[11px] font-bold py-1 px-3 rounded-lg border border-emerald-500/20 transition">
                        File Deposit →
                    </button>
                </div>
            `;
    }
    if (depositStatusWrapper) depositStatusWrapper.innerHTML = "";
    if (depositForm) {
      depositForm.classList.remove("hidden");
      const submitBtn = depositForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerText = "Submit deposit";
        submitBtn.className =
          "w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition shadow-md shadow-emerald-900/10";
      }
      if (txRefInput) {
        txRefInput.disabled = false;
        txRefInput.value = "";
      }
      if (txBankInput) {
        txBankInput.disabled = false;
      }
    }
  }
  await renderContributionHistory();
}

// ==========================================================
// 8A. CONTRIBUTION HISTORY RENDERER
// ==========================================================
async function renderContributionHistory() {
  const historyContainer = document.getElementById("contribution-history");

  if (!historyContainer) return;

  if (!state.currentGroup.id) {
    historyContainer.innerHTML = "";
    return;
  }

  const { data: history, error } = await supabase
    .from("coop_contributions")
    .select(
      `
            round_number,
            amount,
            payment_reference,
            sender_bank_name,
            status,
            created_at
        `,
    )
    .eq("group_id", state.currentGroup.id)
    .eq("member_id", state.sessionUser.id)
    .order("round_number", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Contribution History Error:", error);

    historyContainer.innerHTML = `
            <div class="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-xs text-rose-400">
                Unable to load contribution history.
            </div>
        `;

    return;
  }

  if (!history || history.length === 0) {
    historyContainer.innerHTML = `
            <div class="p-5 rounded-xl border border-dashed border-slate-800 bg-slate-900/20 text-center">
                <p class="text-xs text-slate-500">
                    No contribution history yet.
                </p>
            </div>
        `;

    return;
  }

  const statusMap = {
    APPROVED: {
      badge: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
      icon: "🟢",
      label: "Approved",
    },

    PENDING_VERIFICATION: {
      badge: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
      icon: "🟡",
      label: "Pending",
    },

    REJECTED: {
      badge: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
      icon: "🔴",
      label: "Rejected",
    },
  };

  historyContainer.innerHTML = history
    .map((item, index) => {
      const status = statusMap[item.status] ?? statusMap.PENDING_VERIFICATION;

      const latestBadge =
        index === 0
          ? `
                <div class="mb-2">
                    <span class="text-[9px] font-mono uppercase tracking-[0.25em] text-emerald-400">
                        Latest Contribution
                    </span>
                </div>
            `
          : "";

      return `
            <div class="border border-slate-800 rounded-xl bg-slate-900/20 p-4 animate-fade-in">
               ${latestBadge}

                <div class="flex justify-between items-center mb-3">

                    <span class="text-xs font-bold text-white">
                        Round ${item.round_number}
                    </span>

                    <span class="text-[10px] font-mono px-2 py-1 rounded-full ${status.badge}">
                        ${status.icon} ${status.label}
                    </span>

                </div>

                <div class="grid grid-cols-2 gap-3 text-xs">

                    <div>
                        <span class="text-slate-500 block">Reference</span>
                        <span class="font-mono text-white">
                            ${item.payment_reference}
                        </span>
                    </div>

                    <div>
                        <span class="text-slate-500 block">Bank</span>
                        <span class="text-slate-300">
                            ${item.sender_bank_name}
                        </span>
                    </div>

                    <div>
                        <span class="text-slate-500 block">Amount</span>
                        <span class="font-bold text-white">
                            ₦${Number(item.amount).toLocaleString()}
                        </span>
                    </div>

                    <div>
                        <span class="text-slate-500 block">Submitted</span>
                        <span class="text-slate-300">
                            ${new Date(item.created_at).toLocaleDateString(
                              undefined,
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              },
                            )}

                            <br>

                            <span class="text-[10px] text-slate-500">
                                ${new Date(item.created_at).toLocaleTimeString(
                                  [],
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
                            </span>
                        </span>
                    </div>

                </div>

            </div>
        `;
    })
    .join("");
}

// ==========================================================
// 9. FORM DISPATCH ENGINE
// ==========================================================
function setupFormHandlers() {
  document.addEventListener("submit", async (e) => {
    if (e.target && e.target.id === "deposit-form") {
      e.preventDefault();

      if (!state.currentGroup.id) {
        alert("⚠️ Select an active circle first.");
        return;
      }

      const submitBtn = e.target.querySelector('button[type="submit"]');
      const reference = document.getElementById("tx-ref").value;
      const bank = document.getElementById("tx-bank").value;

      if (!reference.trim()) {
        alert("Reference code is required.");
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerText = "Securing entry...";

      const { error } = await supabase.from("coop_contributions").insert([
        {
          member_id: state.sessionUser.id,
          group_id: state.currentGroup.id,
          round_number: parseInt(state.currentGroup.currentRound),
          amount: parseFloat(state.currentGroup.contributionAmount),
          sender_bank_name: bank,
          sender_account_name: state.userProfile.full_name,
          payment_reference: reference.trim(),
          status: "PENDING_VERIFICATION",
        },
      ]);

      if (error) {
        submitBtn.disabled = false;
        submitBtn.innerText = "Submit deposit";
        alert(
          error.code === "23505"
            ? "🔒 Deposit already submitted for this round."
            : "Error: " + error.message,
        );
      } else {
        alert("🎯 Deposit submitted!");
        document.getElementById("tx-ref").value = "";
        await renderInterfacePanels();
        executeAjoEnginePipeline();
        switchSubView("overview");
      }
    }
  });

  document
    .getElementById("btn-auth-submit")
    .addEventListener("click", handleAuthSubmit);
  document
    .getElementById("btn-auth-switch")
    .addEventListener("click", toggleAuthMode);
  document
    .getElementById("btn-copy-invite")
    .addEventListener("click", copyInviteLink);
  document
    .getElementById("btn-save-profile")
    ?.addEventListener("click", handleUpdateProfileName);
  document
    .getElementById("btn-save-group-config")
    ?.addEventListener("click", handleUpdateGroupConfig);
  document
    .getElementById("btn-archive-group")
    ?.addEventListener("click", handleArchiveGroup);
  document
    .getElementById("btn-force-close-round")
    ?.addEventListener("click", handleForceCloseRound);
}

// ==========================================================
// 10. PROPERTIES MODIFIERS
// ==========================================================
async function handleUpdateGroupConfig() {
  const editName = document.getElementById("edit-group-name").value.trim();
  const editAmount = document.getElementById("edit-group-amount").value;
  const editDesc = document.getElementById("edit-group-desc").value.trim();
  const saveGroupBtn = document.getElementById("btn-save-group-config");

  if (!editName || !editAmount) {
    alert("Fields cannot be blank.");
    return;
  }

  saveGroupBtn.disabled = true;
  const { error } = await supabase
    .from("coop_groups")
    .update({
      group_name: editName,
      contribution_amount: parseInt(editAmount),
      description: editDesc,
    })
    .eq("id", state.currentGroup.id);

  saveGroupBtn.disabled = false;
  if (error) alert(error.message);
  else {
    alert("✨ Settings updated!");
    await syncUserProfileAndGroupRole();
  }
}

async function handleArchiveGroup() {
  if (!state.currentGroup.id) return;

  if (
    !confirm("🚨 Archive this circle? It will be hidden from your dashboard.")
  ) {
    return;
  }

  const archiveBtn = document.getElementById("btn-archive-group");
  if (archiveBtn) archiveBtn.disabled = true;

  const { data, error } = await supabase
    .from("coop_groups")
    .update({ is_archived: true })
    .eq("id", state.currentGroup.id)
    .select();

  if (error) {
    console.error(error);
    alert("Unable to archive circle.");
    if (archiveBtn) archiveBtn.disabled = false;
    return;
  }

  // Safety check: update succeeded but no rows changed
  if (!data || data.length === 0) {
    alert("No circle was archived.");
    if (archiveBtn) archiveBtn.disabled = false;
    return;
  }

  alert("📦 Circle archived.");

  // Reload dashboard
  window.location.search = "";
}

// ==========================================================
// 11. AUDIT RECONCILIATION GATE
// ==========================================================
async function fetchAndRenderAuditFeed() {
  const presentContainer = document.getElementById("audit-feed-present");
  const cardsContainer = document.getElementById("audit-feed-cards");
  const rowsContainer = document.getElementById("audit-feed-rows");
  const emptyState = document.getElementById("audit-feed-empty");

  if (!presentContainer || !cardsContainer || !rowsContainer || !emptyState)
    return;

  const { data: pendingRows } = await supabase
    .from("coop_contributions")
    .select("*")
    .eq("group_id", state.currentGroup.id)
    .eq("round_number", state.currentGroup.currentRound)
    .eq("status", "PENDING_VERIFICATION");

  if (!pendingRows || pendingRows.length === 0) {
    presentContainer.classList.add("hidden");
    emptyState.classList.remove("hidden");
    return;
  }

  presentContainer.classList.remove("hidden");
  emptyState.classList.add("hidden");

  cardsContainer.innerHTML = pendingRows
    .map(
      (row) => `
        <div class="border border-slate-800 bg-slate-900/30 rounded-xl p-4 flex items-center justify-between gap-4 text-xs animate-fade-in">
            <div class="space-y-1 min-w-0 flex-1">
                <div class="flex items-center gap-2">
                    <span class="font-bold text-white truncate text-sm">${row.sender_account_name}</span>
                    <span class="font-mono text-[10px] text-slate-500 shrink-0">
                        ${new Date(row.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                </div>
                <div class="space-y-0.5">
                    <span class="block font-mono text-emerald-400 font-bold break-all select-all">${row.payment_reference}</span>
                    <span class="text-[10px] text-slate-400 block">
                        ${row.sender_bank_name} • <span class="font-mono font-bold text-slate-300">₦${(row.amount || 0).toLocaleString()}</span>
                    </span> 
                </div>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
                <button onclick="approveTransaction(this, '${row.id}')" title="Approve" aria-label="Approve" class="h-9 w-9 flex items-center justify-center bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-xl transition active:scale-95 duration-100 border border-emerald-500/10">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                </button>
                <button onclick="rejectTransaction(this, '${row.id}')" title="Reject" aria-label="Reject" class="h-9 w-9 flex items-center justify-center bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white rounded-xl transition active:scale-95 duration-100 border border-rose-500/10">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                </button>
            </div>
        </div>
    `,
    )
    .join("");

  rowsContainer.innerHTML = pendingRows
    .map(
      (row) => `
        <tr class="hover:bg-slate-900/10 text-xs transition border-b border-slate-800/40">
            <td class="p-3 font-mono text-slate-500">${new Date(row.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
            <td class="p-3 font-bold text-white max-w-[140px] truncate">${row.sender_account_name}</td>
            <td class="p-3">
                <span class="block font-mono text-emerald-400 font-bold tracking-wide">${row.payment_reference}</span>
                <span class="text-[11px] text-slate-400 block mt-0.5">${row.sender_bank_name} • ₦${(row.amount || 0).toLocaleString()}</span> 
            </td>
            <td class="p-3 text-right space-x-2 whitespace-nowrap">
                <button onclick="approveTransaction(this, '${row.id}')" class="bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white text-[11px] font-bold py-1.5 px-3 rounded-lg transition active:scale-95 duration-100 shadow-sm">
                    Approve
                </button>
                <button onclick="rejectTransaction(this, '${row.id}')" class="bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white text-[11px] font-bold py-1.5 px-3 rounded-lg transition active:scale-95 duration-100 shadow-sm">
                    Reject
                </button>
            </td>
        </tr>
    `,
    )
    .join("");
}

async function approveTransaction(buttonElement, id) {
  const originalHtml = buttonElement.innerHTML;

  try {
    buttonElement.disabled = true;

    if (!buttonElement.querySelector("svg")) {
      buttonElement.innerText = "Processing...";
    } else {
      buttonElement.classList.add("opacity-40");
    }

    const { error } = await supabase
      .from("coop_contributions")
      .update({
        status: "APPROVED",
      })
      .eq("id", id);

    if (error) {
      throw error;
    }

    executeAjoEnginePipeline();

    await renderInterfacePanels();

    await fetchAndRenderAuditFeed();
  } catch (err) {
    console.error("Approve Transaction Error:", err);

    alert("❌ " + err.message);

    buttonElement.disabled = false;
    buttonElement.innerHTML = originalHtml;
    buttonElement.classList.remove("opacity-40");
  }
}

async function rejectTransaction(buttonElement, id) {
  const confirmation = confirm(
    "Reject this contribution?\n\nThe payment will remain in the audit history but will no longer count toward the current round.",
  );

  if (!confirmation) return;

  const originalHtml = buttonElement.innerHTML;

  try {
    buttonElement.disabled = true;

    if (!buttonElement.querySelector("svg")) {
      buttonElement.innerText = "Rejecting...";
    } else {
      buttonElement.classList.add("opacity-40");
    }

    const { data, error } = await supabase
      .from("coop_contributions")
      .update({
        status: "REJECTED",
      })
      .eq("id", id)
      .select();

    if (error) {
      throw error;
    }

    executeAjoEnginePipeline();

    await renderInterfacePanels();

    await fetchAndRenderAuditFeed();
  } catch (err) {
    console.error("Reject Transaction Error:", err);

    alert("❌ " + err.message);

    buttonElement.disabled = false;
    buttonElement.innerHTML = originalHtml;
    buttonElement.classList.remove("opacity-40");
  }
}

// ==========================================================
// 12. RUNTIME UI DISPLAYS
// ==========================================================
function renderGlobalAjoBanner(collectorName, totalPoolValue) {
  const container = document.getElementById("global-ajo-banner");
  if (!container) return;

  if (!state.currentGroup.id) {
    if (state.userCirclesList.length === 0) {
      container.innerHTML = `
      <div class="p-5 rounded-xl border border-dashed border-slate-800 bg-slate-900/40 text-center">
          <h3 class="text-sm font-bold text-white mb-2">
              Welcome to Coop Ledger
          </h3>

<p class="text-xs text-slate-400 leading-relaxed">
    You're not a member of any cooperative circle yet.
    Create your first circle to get started or join one using an invitation link from another member.
</p>
      </div>
    `;
    } else {
      container.innerHTML = `
      <div class="p-4 rounded-xl border border-dashed border-slate-800 bg-slate-900/40 text-center text-slate-500 text-xs">
          Choose a circle to start.
      </div>
    `;
    }

    return;
  }

  container.innerHTML = `
        <div class="p-4 rounded-xl border border-emerald-500/20 bg-slate-900/60 text-white mb-6 backdrop-blur">
            <div class="flex justify-between items-center flex-wrap gap-2">
                <div>
                    <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-400/10 text-emerald-400 uppercase border border-emerald-400/10">Round ${state.currentGroup.currentRound}</span>
                    <h2 class="text-sm font-bold mt-1">Collector: <span class="text-yellow-400">${collectorName}</span></h2>
                </div>
                <div class="text-right">
                    <span class="text-[10px] text-slate-400 block uppercase font-mono">Total pool value</span>
                    <span class="text-lg font-black text-emerald-400 font-mono">₦${totalPoolValue.toLocaleString()}</span>
                </div>
            </div>
        </div>
    `;
}

function renderAuthBadge() {
  const badge = document.getElementById("auth-status-badge");

  if (!badge) return;

  if (!state.sessionUser) {
    badge.innerHTML = "";
    return;
  }

  badge.innerHTML = `
        <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 mr-2 border border-slate-700">
            ${state.effectiveRole}
        </span>

        <button
            id="btn-logout"
            onclick="handleLogout()"
            class="text-xs font-bold text-rose-400 hover:underline transition"
        >
            Sign Out
        </button>
    `;
}

async function handleLogout() {
  const logoutBtn = document.getElementById("btn-logout");

  if (logoutBtn) {
    logoutBtn.disabled = true;
    logoutBtn.innerText = "Signing Out...";
  }

  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }

    // Do nothing else.
    // initAuthListeners() will receive SIGNED_OUT
    // and reset the application automatically.
  } catch (err) {
    console.error("Logout Error:", err);

    alert("❌ " + err.message);

    if (logoutBtn) {
      logoutBtn.disabled = false;
      logoutBtn.innerText = "Sign Out";
    }
  }
}

function toggleView(view) {
  const authView = document.getElementById("auth-view");
  const dashView = document.getElementById("dashboard-view");
  const hubView = document.getElementById("global-circles-hub");
  const loadingScreen = document.getElementById("app-loading-screen");

  if (view === "DASHBOARD") {
    dashView.classList.remove("hidden");
    hubView.classList.remove("hidden");
    authView.classList.add("hidden");
    switchSubView("overview");
  } else {
    authView.classList.remove("hidden");
    dashView.classList.add("hidden");
    hubView.classList.add("hidden");
  }

  if (loadingScreen) {
    loadingScreen.classList.add("opacity-0", "pointer-events-none");
    setTimeout(() => loadingScreen.classList.add("hidden"), 350);
  }
}

function switchSubView(viewName) {
  document
    .querySelectorAll(".sub-view")
    .forEach((p) => p.classList.add("hidden"));
  document.getElementById(`view-${viewName}`)?.classList.remove("hidden");
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.remove(
      "bg-slate-900",
      "text-emerald-400",
      "border-slate-800",
    );
    btn.classList.add("bg-slate-950", "text-slate-400");
  });
  const targetBtn = document.getElementById(`tab-${viewName}`);
  if (targetBtn) {
    targetBtn.classList.remove("bg-slate-950", "text-slate-400");
    targetBtn.classList.add(
      "bg-slate-900",
      "text-emerald-400",
      "border-slate-800",
    );
  }
}

async function handleLogin() {
  const email = document.getElementById("auth-email").value.trim();
  const password = document.getElementById("auth-password").value;

  const submitBtn = document.getElementById("btn-auth-submit");
  const switchBtn = document.getElementById("btn-auth-switch");

  if (!email || !password) {
    alert("⚠️ Please fill in all fields.");
    return;
  }

  submitBtn.disabled = true;
  switchBtn.disabled = true;

  submitBtn.innerText = "Authenticating...";

  submitBtn.classList.add("opacity-50", "cursor-not-allowed");

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    // Successful login.
    // Do NOT touch the UI here.
    // The auth listener will receive SIGNED_IN
    // and transition into the dashboard.
  } catch (err) {
    alert("❌ Authentication Failed: " + err.message);

    submitBtn.disabled = false;
    switchBtn.disabled = false;

    submitBtn.innerText = "Sign In";

    submitBtn.classList.remove("opacity-50", "cursor-not-allowed");
  }
}

async function handleRegister() {
  const fullName = document.getElementById("auth-name").value.trim();
  const email = document.getElementById("auth-email").value.trim();
  const password = document.getElementById("auth-password").value;
  const submitBtn = document.getElementById("btn-auth-submit");
  const switchBtn = document.getElementById("btn-auth-switch");

  if (!fullName || !email || !password) {
    alert("⚠️ Please fill in all fields.");
    return;
  }
  if (password.length < 6) {
    alert("⚠️ Password must be at least 6 characters.");
    return;
  }

  switchBtn.disabled = true;
  submitBtn.disabled = true;
  const originalText = switchBtn.innerText;
  switchBtn.innerText = "Creating Account...";
  switchBtn.classList.add("opacity-50", "cursor-not-allowed");

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    alert("❌ Registration Failed: " + error.message);
    submitBtn.disabled = false;
    switchBtn.disabled = false;
    switchBtn.innerText = originalText;
    switchBtn.classList.remove("opacity-50", "cursor-not-allowed");
  } else {
    alert("🎯 Account setup complete! Logging in...");
    document.getElementById("auth-name").value = "";
    document.getElementById("auth-email").value = "";
    document.getElementById("auth-password").value = "";

    submitBtn.disabled = false;
    switchBtn.disabled = false;
    switchBtn.innerText = originalText;
    switchBtn.classList.remove("opacity-50", "cursor-not-allowed");
  }
}

async function handleAuthSubmit() {
  if (state.authMode === "login") {
    await handleLogin();
  } else {
    await handleRegister();
  }
}

function toggleAuthMode() {
  if (state.authMode === "login") {
    showRegisterMode();
  } else {
    showLoginMode();
  }
}

function showLoginMode() {
  state.authMode = "login";

  document.getElementById("auth-mode-badge").innerText = "Sign In";

  document.getElementById("auth-title").innerText = "Welcome back";

  document.getElementById("auth-subtitle").innerText =
    "Access your contribution circles.";

  document.getElementById("auth-name-field").classList.add("hidden");

  // Clear the Full Name field whenever we return to Login mode
  document.getElementById("auth-name").value = "";

  document.getElementById("btn-auth-submit").innerText = "Sign In";

  document.getElementById("auth-switch-text").innerText = "New to Coop Ledger?";

  document.getElementById("btn-auth-switch").innerText = "Create Account";
}

function showRegisterMode() {
  state.authMode = "register";

  document.getElementById("auth-mode-badge").innerText = "Create Account";

  document.getElementById("auth-title").innerText = "Create your account";

  document.getElementById("auth-subtitle").innerText =
    "Join your first contribution circle.";

  document.getElementById("auth-name-field").classList.remove("hidden");

  document.getElementById("btn-auth-submit").innerText = "Create Account";

  document.getElementById("auth-switch-text").innerText =
    "Already have an account?";

  document.getElementById("btn-auth-switch").innerText = "Back to Sign In";
}

// ==========================================================
// 13. UTILITIES, WORKSPACES & DIAGNOSTICS
// ==========================================================
function setupPasswordToggle() {
  const toggleBtn = document.getElementById("toggle-password");
  const passInput = document.getElementById("auth-password");
  if (!toggleBtn || !passInput) return;
  toggleBtn.addEventListener("click", () => {
    if (passInput.type === "password") {
      passInput.type = "text";
      toggleBtn.classList.add("text-emerald-400");
    } else {
      passInput.type = "password";
      toggleBtn.classList.remove("text-emerald-400");
    }
  });
}

async function handleUpdateProfileName() {
  const newName = document.getElementById("settings-profile-name").value.trim();
  if (!newName) return;
  await supabase
    .from("coop_profiles")
    .update({ full_name: newName })
    .eq("id", state.sessionUser.id);
  alert("Profile updated successfully.");
  await syncUserProfileAndGroupRole();
}

function copyInviteLink() {
  if (!state.currentGroup.id) return;
  const inviteLink = `${window.location.origin}${window.location.pathname}?group=${state.currentGroup.id}`;
  navigator.clipboard
    .writeText(inviteLink)
    .then(() => alert("📋 Share link copied!"));
}

// KEY GENERATION FIX: Delegates primary key provisioning safely to the database engine
async function handleCreateGroupWizard() {
  const customName = prompt("Name your new circle:");

  // User cancelled or entered an empty name
  if (!customName || !customName.trim()) {
    return;
  }

  const customAmount = prompt("Enter the round goal amount (₦):", "50000");

  // User cancelled the goal amount prompt
  if (customAmount === null) {
    return;
  }

  const formattedAmount = Number(customAmount);

  // Validate the entered amount
  if (!Number.isFinite(formattedAmount) || formattedAmount <= 0) {
    alert("Please enter a valid contribution amount.");
    return;
  }

  const { data: newGroup, error } = await supabase
    .from("coop_groups")
    .insert([
      {
        group_name: customName.trim(),
        contribution_amount: formattedAmount,
        current_round: 1,
        created_by: state.sessionUser.id,
        description: "Savings and contribution circle.",
      },
    ])
    .select("id")
    .single();

  if (error) {
    alert("Error creating circle: " + error.message);
    return;
  }

  const { error: memberError } = await supabase
    .from("coop_group_members")
    .insert([
      {
        group_id: newGroup.id,
        user_id: state.sessionUser.id,
      },
    ]);

  if (memberError) {
    alert("Circle created, but failed to add you as a member.");
    return;
  }

  alert("🎯 Circle created successfully!");

  await switchCircleWorkspace(newGroup.id);
}

function logSimulatedWhatsAppAlert(memberName, contactMessage) {
  const streamContainer = document.getElementById(
    "whatsapp-diagnostic-strings",
  );
  if (!streamContainer) return;

  if (
    streamContainer.innerHTML.includes(
      "Awaiting engine operational triggers...",
    )
  ) {
    streamContainer.innerHTML = "";
  }

  const currentTimestamp = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const dynamicRow = document.createElement("div");

  dynamicRow.className =
    "p-2 rounded bg-slate-900/50 border border-slate-900/60 animate-fade-in text-[11px] leading-relaxed";
  dynamicRow.innerHTML = `
        <span class="text-slate-500 font-bold">[${currentTimestamp}] Outbound WhatsApp Hook -></span> 
        <span class="text-yellow-500 font-bold">@${memberName}</span><br/>
        <span class="text-slate-400 font-mono">"${contactMessage}"</span>
    `;

  streamContainer.prepend(dynamicRow);
}

async function handleForceCloseRound() {
  if (!state.currentGroup.id) return;

  const confirmationPrompt = confirm(
    `🚨 WARNING FOR THE TREASURER:\n\nAre you sure you want to force close Round ${state.currentGroup.currentRound}?\nThis instantly sweeps the circle status, flags defaulters, and moves to Round ${state.currentGroup.currentRound + 1}. This action cannot be undone.`,
  );

  if (!confirmationPrompt) return;

  const actionButton = document.getElementById("btn-force-close-round");

  if (actionButton) {
    actionButton.disabled = true;
    actionButton.innerText = "Processing Pipeline...";
  }

  try {
    // -------------------------------------------------
    // Load all members of the current group
    // -------------------------------------------------
    const { data: membershipMatrix, error: memberFetchError } = await supabase
      .from("coop_group_members")
      .select("user_id")
      .eq("group_id", state.currentGroup.id);

    if (memberFetchError) {
      throw memberFetchError;
    }

    const memberIds = membershipMatrix?.map((member) => member.user_id) ?? [];

    // -------------------------------------------------
    // Load member profiles
    // -------------------------------------------------
    let profiles = [];

    if (memberIds.length > 0) {
      const { data: profileData, error: profileFetchError } = await supabase
        .from("coop_profiles")
        .select("id, full_name")
        .in("id", memberIds);

      if (profileFetchError) {
        throw profileFetchError;
      }

      profiles = profileData ?? [];
    }

    const profileLookup = Object.fromEntries(
      profiles.map((profile) => [profile.id, profile]),
    );

    // -------------------------------------------------
    // Fetch approved contributions
    // -------------------------------------------------
    const { data: approvedDeposits, error: depositFetchError } = await supabase
      .from("coop_contributions")
      .select("member_id")
      .eq("group_id", state.currentGroup.id)
      .eq("round_number", state.currentGroup.currentRound)
      .eq("status", "APPROVED");

    if (depositFetchError) {
      throw depositFetchError;
    }

    const approvedMemberIds =
      approvedDeposits?.map((record) => record.member_id) ?? [];

    // -------------------------------------------------
    // Notify defaulters
    // -------------------------------------------------
    let alertTriggerCount = 0;

    for (const member of membershipMatrix) {
      const userId = member.user_id;

      const profileName = profileLookup[userId]?.full_name ?? "Unknown Member";

      if (!approvedMemberIds.includes(userId)) {
        alertTriggerCount++;

        const dynamicMessage = `Ajo Circular Notice: Round ${state.currentGroup.currentRound} has been closed by the Group Manager. Your contribution was marked as outstanding. A missed-cycle penalty fee has been issued to your ledger account.`;

        logSimulatedWhatsAppAlert(profileName, dynamicMessage);
      }
    }

    if (alertTriggerCount === 0) {
      logSimulatedWhatsAppAlert(
        "System Engine",
        "✅ Splendid! All active circle members processed clean payments for this round cycle.",
      );
    }

    // -------------------------------------------------
    // Advance the group to the next round
    // -------------------------------------------------
    const advancedRoundTarget = Number(state.currentGroup.currentRound) + 1;

    const { error: groupUpdateError } = await supabase
      .from("coop_groups")
      .update({
        current_round: advancedRoundTarget,
      })
      .eq("id", state.currentGroup.id);

    if (groupUpdateError) {
      throw groupUpdateError;
    }

    alert(
      `🎯 Round ${state.currentGroup.currentRound} closed! The circle has safely migrated to Round ${advancedRoundTarget}.`,
    );

    await syncUserProfileAndGroupRole();
  } catch (err) {
    console.error("Critical Failure in Force Close Gate:", err);

    alert("❌ Automation Engine Failed:\n\n" + err.message);
  } finally {
    if (actionButton) {
      actionButton.disabled = false;
      actionButton.innerText = "⏳ Force Close & Advance";
    }
  }
}
