// ==========================================================
// 1. SUPABASE CLIENT CONFIGURATION
// ==========================================================
const SUPABASE_URL = window.SUPABASE_CONFIG.URL;
const SUPABASE_ANON_KEY = window.SUPABASE_CONFIG.ANON_KEY;
window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==========================================================
// 2. GLOBAL STATE MATRIX WITH CONTEXT-DRIVEN ROLES
// ==========================================================
const urlParams = new URLSearchParams(window.location.search);
let urlGroupId = urlParams.get('group') || null;

const state = {
    sessionUser: null,
    userProfile: null,
    userCirclesList: [], // Dynamically isolated workspaces
    currentGroup: {
        id: urlGroupId,
        name: "No Active Circle",
        contributionAmount: 50000,
        currentRound: 1,
        createdBy: null,
        description: ""
    },
    effectiveRole: "MEMBER" // Calculated dynamically per workspace context
};

// ==========================================================
// 3. APPLICATION INITIATION & AUTHENTICATION LISTENERS
// ==========================================================
document.addEventListener('DOMContentLoaded', () => {
    initAuthListeners();
    setupFormHandlers();
    setupPasswordToggle();
});

function initAuthListeners() {
    supabase.auth.onAuthStateChange(async (event, session) => {
        if (session) {
            state.sessionUser = session.user;
            await syncUserProfileAndGroupRole();
            toggleView('DASHBOARD');
        } else {
            state.sessionUser = null;
            state.userProfile = null;
            state.userCirclesList = [];
            toggleView('AUTH');
            renderAuthBadge();
        }
    });
}

// ==========================================================
// 4. CONTEXTUAL ROLE RECALCULATOR & FILTER ENGINE
// ==========================================================
async function syncUserProfileAndGroupRole() {
    try {
        if (!state.sessionUser) return;

        // Fetch user handle
        let { data: profile } = await supabase
            .from('coop_profiles')
            .select('*')
            .eq('id', state.sessionUser.id)
            .maybeSingle();

        if (!profile) {
            const tempName = state.sessionUser.email.split('@')[0].toUpperCase();
            const { data: newProfile } = await supabase
                .from('coop_profiles')
                .insert([{ id: state.sessionUser.id, full_name: tempName, role: 'MEMBER' }])
                .select()
                .single();
            profile = newProfile;
        }
        state.userProfile = profile;

        // Gather only the active workspaces this specific user has access to
        await fetchIsolateWorkspaces();

        // If no circle context is chosen yet, auto-select their first available workspace
        if (!state.currentGroup.id && state.userCirclesList.length > 0) {
            state.currentGroup.id = state.userCirclesList[0].id;
        }

        // Hydrate specific active circle details
        if (state.currentGroup.id) {
            const { data: groupData } = await supabase
                .from('coop_groups')
                .select('*')
                .eq('id', state.currentGroup.id)
                .maybeSingle();

            if (groupData && !groupData.is_archived) {
                state.currentGroup.name = groupData.group_name;
                state.currentGroup.contributionAmount = groupData.contribution_amount;
                state.currentGroup.currentRound = groupData.current_round;
                state.currentGroup.createdBy = groupData.created_by;
                state.currentGroup.description = groupData.description || "No core guidelines set.";

                // CRITICAL PERMISSION MATRIX: Check if current user is the creator of THIS specific circle
                state.effectiveRole = (state.currentGroup.createdBy === state.sessionUser.id) ? 'TREASURER' : 'MEMBER';
            } else {
                state.currentGroup.id = null;
                state.effectiveRole = 'MEMBER';
            }
        }

        // Update UI controls dynamically based on calculated workspace authority
        if (state.effectiveRole === 'TREASURER') {
            document.getElementById('tab-audit')?.classList.remove('hidden');
            document.getElementById('treasurer-settings-block')?.classList.remove('hidden');
            document.getElementById('group-config-panel')?.classList.remove('hidden');

            // Populate administrative configuration inputs
            const nameField = document.getElementById('edit-group-name');
            const amtField = document.getElementById('edit-group-amount');
            const descField = document.getElementById('edit-group-desc');

            if (nameField) nameField.value = state.currentGroup.name;
            if (amtField) amtField.value = state.currentGroup.contributionAmount;
            if (descField) descField.value = state.currentGroup.description;
        } else {
            // Tighten security down for basic members
            document.getElementById('tab-audit')?.classList.add('hidden');
            document.getElementById('treasurer-settings-block')?.classList.add('hidden');
            document.getElementById('group-config-panel')?.classList.add('hidden');
        }

        if (document.getElementById('settings-profile-name')) {
            document.getElementById('settings-profile-name').value = state.userProfile.full_name || '';
        }

        renderAuthBadge();
        renderCirclesHubDeck();
        await renderInterfacePanels();
        executeAjoEnginePipeline();
    } catch (err) {
        console.error("Profile Synchronization Error:", err.message);
    }
}

// ==========================================================
// 5. SECURITY DISCOVERY: FETCHING ONLY JOINED/OWNED GROUPS
// ==========================================================
async function fetchIsolateWorkspaces() {
    try {
        const { data: ownedGroups } = await supabase
            .from('coop_groups')
            .select('*')
            .eq('created_by', state.sessionUser.id);

        const { data: joinedTx } = await supabase
            .from('coop_contributions')
            .select('group_id')
            .eq('member_id', state.sessionUser.id);

        const joinedIds = joinedTx ? joinedTx.map(t => t.group_id) : [];

        if (urlGroupId) {
            joinedIds.push(urlGroupId);
        }

        let query = supabase.from('coop_groups').select('*');

        if ((ownedGroups && ownedGroups.length > 0) || joinedIds.length > 0) {
            const dynamicFilters = [];
            if (state.sessionUser.id) dynamicFilters.push(`created_by.eq.${state.sessionUser.id}`);
            if (joinedIds.length > 0) dynamicFilters.push(`id.in.(${joinedIds.join(',')})`);
            query = query.or(dynamicFilters.join(','));
        } else {
            query = query.eq('id', 'FORCE_EMPTY_SET');
        }

        const { data: crossFilteredGroups } = await query
            .eq('is_archived', false)
            .order('created_at', { ascending: false });

        state.userCirclesList = crossFilteredGroups || [];
    } catch (err) {
        console.error("Workspace Filtering Failure:", err.message);
    }
}

// ==========================================================
// HYBRID INTEGRATED HUB DECK MATRIX RENDER LOOP
// ==========================================================
function renderCirclesHubDeck() {
    const grid = document.getElementById('circles-directory-grid');
    if (!grid) return;

    if (state.userCirclesList.length === 0) {
        grid.innerHTML = `<div class="col-span-full text-xs text-slate-500 italic p-2">You haven't joined or spearheaded any circles yet.</div>`;
        return;
    }

    // Map loops inject cards: elements past index 2 receive responsive 'lg:hidden' visibility filters
    let cardsHtml = state.userCirclesList.map((group, index) => {
        const isCurrent = group.id === state.currentGroup.id;
        const isOwner = group.created_by === state.sessionUser.id;
        const responsiveClass = index >= 3 ? 'lg:hidden' : '';

        return `
            <div onclick="switchCircleWorkspace('${group.id}')" 
                class="${responsiveClass} snap-start shrink-0 min-w-[85%] sm:min-w-[48%] lg:min-w-0 h-20 p-3.5 rounded-xl border transition flex flex-col justify-between h-20 shadow-sm cursor-pointer
                ${isCurrent
                ? 'bg-slate-900 border-emerald-500/50 ring-1 ring-emerald-500/20 text-white'
                : 'bg-slate-950 hover:bg-slate-900/60 border-slate-800 text-slate-300 hover:text-white'}">
                <div class="flex justify-between items-start gap-2">
                    <h4 class="text-xs font-bold truncate max-w-[150px] tracking-wide">${group.group_name}</h4>
                    <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                        ₦${(group.contribution_amount || 0).toLocaleString()}
                    </span>
                </div>
                <div class="flex justify-between items-center text-[10px] font-medium">
                    <span class="text-slate-500">${isOwner ? '👑 Spearheading' : '🏃 Participant'}</span>
                    ${isCurrent ? '<span class="text-emerald-400 font-bold flex items-center gap-1">● Active</span>' : '<span class="text-slate-500">View →</span>'}
                </div>
            </div>
        `;
    }).join('');

    // Append standard interactive SaaS Drawer utility trigger card if total active scopes break row boundaries
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

// Drawer-specific data list hydration
function renderDrawerCirclesList(circles) {
    const drawerList = document.getElementById('drawer-circles-list');
    if (!drawerList) return;

    if (circles.length === 0) {
        drawerList.innerHTML = `<div class="text-xs text-slate-500 italic p-4 text-center font-mono">No matching records found.</div>`;
        return;
    }

    drawerList.innerHTML = circles.map(group => {
        const isCurrent = group.id === state.currentGroup.id;
        const isOwner = group.created_by === state.sessionUser.id;
        return `
            <div onclick="switchCircleWorkspace('${group.id}'); closeCirclesDrawer();" 
                class="p-3.5 rounded-xl border transition flex items-center justify-between cursor-pointer shadow-sm
                ${isCurrent
                ? 'bg-slate-900 border-emerald-500/50 ring-1 ring-emerald-500/10'
                : 'bg-slate-950 hover:bg-slate-900/60 border-slate-800 text-slate-300 hover:text-white'}" >
                <div class="flex flex-col gap-0.5 truncate max-w-[70%]">
                    <h4 class="text-xs font-bold truncate tracking-wide text-slate-200">${group.group_name}</h4>
                    <span class="text-[10px] text-slate-500 font-medium">${isOwner ? '👑 Spearheading' : '🏃 Participant'}</span>
                </div>
                <div class="text-right flex flex-col items-end gap-1 font-mono shrink-0">
                    <span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                        ₦${(group.contribution_amount || 0).toLocaleString()}
                    </span>
                    ${isCurrent ? '<span class="text-emerald-400 font-bold text-[9px] uppercase tracking-widest">● Active</span>' : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Global scope window accessors for side drawer actions
window.openCirclesDrawer = function () {
    const drawer = document.getElementById('circles-drawer');
    const backdrop = document.getElementById('circles-drawer-backdrop');
    if (drawer && backdrop) {
        backdrop.classList.remove('opacity-0', 'pointer-events-none');
        backdrop.classList.add('opacity-100');
        drawer.classList.remove('translate-x-full');
    }
    const searchInput = document.getElementById('drawer-search-input');
    if (searchInput) searchInput.value = '';
    renderDrawerCirclesList(state.userCirclesList);
};

window.closeCirclesDrawer = function () {
    const drawer = document.getElementById('circles-drawer');
    const backdrop = document.getElementById('circles-drawer-backdrop');
    if (drawer && backdrop) {
        backdrop.classList.remove('opacity-100');
        backdrop.classList.add('opacity-0', 'pointer-events-none');
        drawer.classList.add('translate-x-full');
    }
};

window.filterDrawerCircles = function () {
    const searchVal = document.getElementById('drawer-search-input')?.value.toLowerCase().trim() || "";
    const filtered = state.userCirclesList.filter(group =>
        group.group_name.toLowerCase().includes(searchVal)
    );
    renderDrawerCirclesList(filtered);
};

async function switchCircleWorkspace(targetGroupId) {
    state.currentGroup.id = targetGroupId;
    urlGroupId = targetGroupId;

    const newUrl = `${window.location.origin}${window.location.pathname}?group=${targetGroupId}`;
    window.history.pushState({ path: newUrl }, '', newUrl);

    switchSubView('overview');
    await syncUserProfileAndGroupRole();
}

// ==========================================================
// 6. PIPELINE ENGINE MANAGEMENT
// ==========================================================
async function executeAjoEnginePipeline() {
    try {
        if (!state.currentGroup.id) {
            renderGlobalAjoBanner("No Circle Active", 0);
            return;
        }

        const displayTitle = document.getElementById('display-group-name');
        if (displayTitle) displayTitle.innerText = state.currentGroup.name;

        const displayDesc = document.getElementById('display-group-desc');
        if (displayDesc) displayDesc.innerText = state.currentGroup.description;

        const { data: contributions, error: txErr } = await supabase
            .from('coop_contributions')
            .select(`
                member_id, created_at, status, sender_account_name, amount,
                coop_profiles (full_name)
            `)
            .eq('group_id', state.currentGroup.id)
            .eq('round_number', state.currentGroup.currentRound)
            .eq('status', 'APPROVED')
            .order('created_at', { ascending: true });

        if (txErr) throw txErr;

        let electedCollector = "No Approved Sprints Yet";
        if (contributions && contributions.length > 0) {
            electedCollector = contributions[0].coop_profiles?.full_name || contributions[0].sender_account_name || "Co-op Member";
        }

        renderGlobalAjoBanner(electedCollector, contributions ? contributions.length : 0);

        if (state.effectiveRole === 'TREASURER') {
            await fetchAndRenderAuditFeed();
        }
    } catch (err) {
        console.error("Pipeline Computation Error:", err.message);
    }
}

// ==========================================================
// 7. MULTI-PANEL VIEW INTERACTORS
// ==========================================================
async function renderInterfacePanels() {
    const mPanel = document.getElementById('member-panel');
    const txAmountInput = document.getElementById('tx-amount');
    const depositForm = document.getElementById('deposit-form');
    const depositStatusWrapper = document.getElementById('deposit-status-wrapper');
    const txRefInput = document.getElementById('tx-ref');
    const txBankInput = document.getElementById('tx-bank');

    if (txAmountInput) {
        txAmountInput.value = `₦ ${(state.currentGroup.contributionAmount || 0).toLocaleString()}`;
    }

    if (!state.currentGroup.id) {
        if (mPanel) mPanel.innerHTML = `<div class="p-6 text-center text-slate-500 italic w-full">Select a workspace loop above to start tracking.</div>`;
        return;
    }

    const { data: userLog } = await supabase
        .from('coop_contributions')
        .select('status, payment_reference, sender_bank_name, amount, created_at')
        .eq('group_id', state.currentGroup.id)
        .eq('round_number', state.currentGroup.currentRound)
        .eq('member_id', state.sessionUser.id)
        .maybeSingle();

    if (userLog) {
        const isApproved = userLog.status === 'APPROVED';
        const displayRef = userLog.payment_reference || "N/A";
        const displayBank = userLog.sender_bank_name || "Direct Node Wire";
        const displayAmt = userLog.amount ? userLog.amount.toLocaleString() : (state.currentGroup.contributionAmount || 0).toLocaleString();
        const displayTime = userLog.created_at ? new Date(userLog.created_at).toLocaleTimeString() : new Date().toLocaleTimeString();

        if (mPanel) {
            mPanel.innerHTML = `
                <div class="border border-slate-800 bg-slate-900/20 rounded-xl p-5 space-y-4 animate-fade-in">
                    <div class="flex items-center justify-between border-b border-slate-900 pb-3">
                        <h3 class="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Your Personal Standing</h3>
                        <span class="text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider
                            ${isApproved
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}">
                            ● ${isApproved ? 'Cleared & Verified' : 'Awaiting Treasury Audit'}
                        </span>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div class="bg-slate-950 p-3 rounded-lg border border-slate-900/60">
                            <span class="text-[10px] text-slate-500 block uppercase font-mono mb-1">Cycle Allocation</span>
                            <span class="text-xs font-bold font-mono text-white">₦ ${displayAmt}</span>
                        </div>
                        <div class="bg-slate-950 p-3 rounded-lg border border-slate-900/60">
                            <span class="text-[10px] text-slate-500 block uppercase font-mono mb-1">Payment Node</span>
                            <span class="text-xs font-bold text-slate-300 font-mono">${displayBank}</span>
                        </div>
                        <div class="bg-slate-950 p-3 rounded-lg border border-slate-900/60">
                            <span class="text-[10px] text-slate-500 block uppercase font-mono mb-1">Secured Reference Token</span>
                            <span class="text-xs font-mono font-bold text-emerald-400 block truncate" title="${displayRef}">${displayRef}</span>
                        </div>
                    </div>
                    <div class="flex justify-between items-center text-[10px] text-slate-500 font-mono pt-1">
                        <span>Logged onto ledger wire: ${displayTime}</span>
                        <span>Round context: ${state.currentGroup.currentRound}</span>
                    </div>
                </div>
            `;
        }

        if (depositStatusWrapper) {
            depositStatusWrapper.innerHTML = `
                <div class="border border-dashed border-slate-800 bg-slate-900/30 rounded-xl p-6 text-center max-w-md mx-auto space-y-3 mb-6 animate-fade-in">
                    <div class="text-xl">${isApproved ? '🧾' : '⏳'}</div>
                    <h4 class="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                        ${isApproved ? 'Deposit Approved & Confirmed' : 'Round Deposit Logged'}
                    </h4>
                    <p class="text-xs text-slate-400 leading-relaxed">
                        ${isApproved
                    ? 'Your contribution token has been approved by the treasurer and is secured safely inside the live pool asset value stack.'
                    : 'Your bank wire reference details are safely stored in the verification timeline queue awaiting administrative review.'}
                    </p>
                    <div class="inline-block bg-slate-950 px-3 py-1.5 rounded font-mono text-[11px] border border-slate-900 text-slate-400">
                        REF: <span class="${isApproved ? 'text-emerald-400' : 'text-amber-400'} font-bold">${displayRef}</span>
                    </div>
                </div>
            `;
        }

        if (depositForm) {
            depositForm.classList.remove('hidden');
            const submitBtn = depositForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerText = "🔒 Deposit Locked For This Round";
                submitBtn.className = "w-full bg-slate-800 text-slate-500 font-mono text-xs font-bold py-2.5 px-4 rounded-xl border border-slate-700 cursor-not-allowed transition";
            }
            if (txRefInput) txRefInput.disabled = true;
            if (txBankInput) txBankInput.disabled = true;
        }

    } else {
        if (mPanel) {
            mPanel.innerHTML = `
                <div class="p-4 text-center text-slate-400 bg-slate-900 border border-slate-800 rounded-xl w-full text-xs flex justify-between items-center flex-wrap gap-2">
                    <span>📣 You haven't registered a deposit tracker for Round ${state.currentGroup.currentRound}.</span>
                    <button onclick="switchSubView('deposit')" class="bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 font-mono text-[11px] font-bold py-1 px-3 rounded-lg border border-emerald-500/20 transition">
                        File Deposit Now →
                    </button>
                </div>
            `;
        }
        if (depositStatusWrapper) depositStatusWrapper.innerHTML = '';
        if (depositForm) {
            depositForm.classList.remove('hidden');
            const submitBtn = depositForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerText = "Dispatch Deposit Log";
                submitBtn.className = "w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition shadow-md shadow-emerald-900/10";
            }
            if (txRefInput) { txRefInput.disabled = false; txRefInput.value = ''; }
            if (txBankInput) txBankInput.disabled = false;
        }
    }
}

// ==========================================================
// 8. GLOBAL EVENT INTERCEPTORS
// ==========================================================
function setupFormHandlers() {
    document.addEventListener('submit', async (e) => {
        if (e.target && e.target.id === 'deposit-form') {
            e.preventDefault();

            if (!state.currentGroup.id) {
                alert("⚠️ Please select an active circle workspace first.");
                return;
            }

            const submitBtn = e.target.querySelector('button[type="submit"]');
            const reference = document.getElementById('tx-ref').value;
            const bank = document.getElementById('tx-bank').value;

            if (!reference.trim()) {
                alert("Transaction reference token is required.");
                return;
            }

            submitBtn.disabled = true;
            submitBtn.innerText = "Securing Ledger Entry...";

            const { error } = await supabase
                .from('coop_contributions')
                .insert([{
                    member_id: state.sessionUser.id,
                    group_id: state.currentGroup.id,
                    round_number: parseInt(state.currentGroup.currentRound),
                    amount: parseFloat(state.currentGroup.contributionAmount),
                    sender_bank_name: bank,
                    sender_account_name: state.userProfile.full_name,
                    payment_reference: reference.trim(),
                    status: 'PENDING_VERIFICATION'
                }]);

            if (error) {
                submitBtn.disabled = false;
                submitBtn.innerText = "Dispatch Deposit Log";
                alert(error.code === '23505' ? "🔒 Anti-Double Spend Guard Activated!" : "Error: " + error.message);
            } else {
                alert("🎯 Tracking code filed into validation channel!");
                document.getElementById('tx-ref').value = '';
                await renderInterfacePanels();
                executeAjoEnginePipeline();
                switchSubView('overview');
            }
        }
    });

    document.getElementById('btn-login').addEventListener('click', handleLogin);
    document.getElementById('btn-register').addEventListener('click', handleRegister);
    document.getElementById('btn-copy-invite').addEventListener('click', copyInviteLink);
    document.getElementById('btn-save-profile')?.addEventListener('click', handleUpdateProfileName);
    document.getElementById('btn-save-group-config')?.addEventListener('click', handleUpdateGroupConfig);
    document.getElementById('btn-archive-group')?.addEventListener('click', handleArchiveGroup);
}

// ==========================================================
// 9. CONFIGURATION EDITS & ARCHIVING ARCHITECTURE
// ==========================================================
async function handleUpdateGroupConfig() {
    const editName = document.getElementById('edit-group-name').value.trim();
    const editAmount = document.getElementById('edit-group-amount').value;
    const editDesc = document.getElementById('edit-group-desc').value.trim();
    const saveGroupBtn = document.getElementById('btn-save-group-config');

    if (!editName || !editAmount) {
        alert("Parameters cannot be blank.");
        return;
    }

    saveGroupBtn.disabled = true;
    const { error } = await supabase
        .from('coop_groups')
        .update({ group_name: editName, contribution_amount: parseInt(editAmount), description: editDesc })
        .eq('id', state.currentGroup.id);

    saveGroupBtn.disabled = false;
    if (error) alert(error.message);
    else {
        alert("✨ Workspace metrics configuration updated inside database!");
        await syncUserProfileAndGroupRole();
    }
}

async function handleArchiveGroup() {
    if (!state.currentGroup.id) return;
    if (!confirm("🚨 Are you sure you want to archive this circle? It will be safely tucked away and removed from all active member dashboard lists.")) return;

    const archiveBtn = document.getElementById('btn-archive-group');
    if (archiveBtn) archiveBtn.disabled = true;

    const { error } = await supabase
        .from('coop_groups')
        .update({ is_archived: true })
        .eq('id', state.currentGroup.id);

    if (error) {
        alert("Error archiving circle: " + error.message);
        if (archiveBtn) archiveBtn.disabled = false;
    } else {
        alert("📦 Circle successfully moved to archives.");
        window.location.search = "";
    }
}

// ==========================================================
// 10. RECONCILIATION QUEUE FEED (WITH LIVE PURGE TOOL)
// ==========================================================
async function fetchAndRenderAuditFeed() {
    const feedContainer = document.getElementById('audit-feed-rows');
    if (!feedContainer) return;

    const { data: pendingRows } = await supabase
        .from('coop_contributions')
        .select('*')
        .eq('group_id', state.currentGroup.id)
        .eq('round_number', state.currentGroup.currentRound)
        .eq('status', 'PENDING_VERIFICATION');

    if (!pendingRows || pendingRows.length === 0) {
        feedContainer.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-xs text-slate-500 italic">Audit verification pipeline is completely cleared.</td></tr>`;
        return;
    }

    feedContainer.innerHTML = pendingRows.map(row => `
        <tr class="border-b border-slate-800 hover:bg-slate-900/40 text-xs">
            <td class="p-4 font-mono text-slate-500">${new Date(row.created_at).toLocaleTimeString()}</td>
            <td class="p-4 font-bold text-white">${row.sender_account_name}</td>
            <td class="p-4">
                <span class="block font-mono text-emerald-400 font-bold">${row.payment_reference}</span>
                <span class="text-[10px] text-slate-400">${row.sender_bank_name} | ₦${(row.amount || 0).toLocaleString()}</span> 
            </td>
            <td class="p-4 text-right space-x-1.5 whitespace-nowrap">
                <button onclick="approveTransaction(this, '${row.id}')" class="bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white text-[10px] font-bold py-1 px-2.5 rounded-lg transition-all active:scale-95 duration-100 shadow-sm">
                    Approve
                </button>
                <button onclick="rejectAndEraseTransaction(this, '${row.id}')" class="bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white text-[10px] font-bold py-1 px-2.5 rounded-lg transition-all active:scale-95 duration-100 shadow-sm">
                    Delete
                </button>
            </td>
        </tr>
    `).join('');
}

async function approveTransaction(buttonElement, id) {
    buttonElement.disabled = true;
    buttonElement.innerText = "Processing...";
    const { error } = await supabase.from('coop_contributions').update({ status: 'APPROVED' }).eq('id', id);
    if (!error) {
        executeAjoEnginePipeline();
        await renderInterfacePanels();
    }
}

async function rejectAndEraseTransaction(buttonElement, id) {
    if (!confirm("Are you sure you want to permanently delete this duplicate or invalid ledger entry?")) return;

    buttonElement.disabled = true;
    buttonElement.innerText = "Erasing...";

    const { error } = await supabase
        .from('coop_contributions')
        .delete()
        .eq('id', id);

    if (!error) {
        alert("🗑️ Entry purged from the ledger queue successfully.");
        executeAjoEnginePipeline();
        await renderInterfacePanels();
    } else {
        alert("Error deleting entry: " + error.message);
        buttonElement.disabled = false;
        buttonElement.innerText = "Delete";
    }
}

// ==========================================================
// 11. DISPLAY WRAPPERS & INTERFACE UTILITIES
// ==========================================================
function renderGlobalAjoBanner(collectorName, verifiedCount) {
    const container = document.getElementById('global-ajo-banner');
    if (!container) return;

    if (!state.currentGroup.id) {
        container.innerHTML = `<div class="p-4 rounded-xl border border-dashed border-slate-800 bg-slate-900/40 text-center text-slate-500 text-xs">Choose or create a workspace tracking profile to start.</div>`;
        return;
    }

    const totalPool = verifiedCount * state.currentGroup.contributionAmount;
    container.innerHTML = `
        <div class="p-4 rounded-xl border border-emerald-500/20 bg-slate-900/60 text-white mb-6 backdrop-blur">
            <div class="flex justify-between items-center flex-wrap gap-2">
                <div>
                    <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-400/10 text-emerald-400 uppercase border border-emerald-400/10">Round ${state.currentGroup.currentRound} Cycle Active</span>
                    <h2 class="text-sm font-bold mt-1">🎯 Target Collector: <span class="text-yellow-400">${collectorName}</span></h2>
                </div>
                <div class="text-right">
                    <span class="text-[10px] text-slate-400 block uppercase font-mono">Accumulated Round Pool Value</span>
                    <span class="text-lg font-black text-emerald-400 font-mono">₦${totalPool.toLocaleString()}</span>
                </div>
            </div>
        </div>
    `;
}

function renderAuthBadge() {
    const badge = document.getElementById('auth-status-badge');
    if (!badge) return;
    if (!state.sessionUser) { badge.innerHTML = ''; return; }
    badge.innerHTML = `
        <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 mr-2 border border-slate-700">${state.effectiveRole}</span>
        <button onclick="supabase.auth.signOut()" class="text-xs font-bold text-rose-400 hover:underline">Sign Out</button>
    `;
}

function toggleView(view) {
    const authView = document.getElementById('auth-view');
    const dashView = document.getElementById('dashboard-view');
    const hubView = document.getElementById('global-circles-hub');
    const loadingScreen = document.getElementById('app-loading-screen');

    if (view === 'DASHBOARD') {
        dashView.classList.remove('hidden');
        hubView.classList.remove('hidden');
        authView.classList.add('hidden');
        switchSubView('overview');
    } else {
        authView.classList.remove('hidden');
        dashView.classList.add('hidden');
        hubView.classList.add('hidden');
    }

    if (loadingScreen) {
        loadingScreen.classList.add('opacity-0', 'pointer-events-none');
        setTimeout(() => loadingScreen.classList.add('hidden'), 350);
    }
}

function switchSubView(viewName) {
    document.querySelectorAll('.sub-view').forEach(p => p.classList.add('hidden'));
    document.getElementById(`view-${viewName}`)?.classList.remove('hidden');
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('bg-slate-900', 'text-emerald-400', 'border-slate-800');
        btn.classList.add('bg-slate-950', 'text-slate-400');
    });
    const targetBtn = document.getElementById(`tab-${viewName}`);
    if (targetBtn) {
        targetBtn.classList.remove('bg-slate-950', 'text-slate-400');
        targetBtn.classList.add('bg-slate-900', 'text-emerald-400', 'border-slate-800');
    }
}

async function handleLogin() {
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    if (!email || !password) return;
    await supabase.auth.signInWithPassword({ email, password });
}

async function handleRegister() {
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    if (!email || password.length < 6) return;
    await supabase.auth.signUp({ email, password });
    alert("Account setup complete! Logging in...");
}

// ==========================================================
// 12. UTILITIES & WIZARDS
// ==========================================================
function setupPasswordToggle() {
    const toggleBtn = document.getElementById('toggle-password');
    const passInput = document.getElementById('auth-password');
    if (!toggleBtn || !passInput) return;
    toggleBtn.addEventListener('click', () => {
        if (passInput.type === 'password') {
            passInput.type = 'text';
            toggleBtn.classList.add('text-emerald-400');
        } else {
            passInput.type = 'password';
            toggleBtn.classList.remove('text-emerald-400');
        }
    });
}

async function handleUpdateProfileName() {
    const newName = document.getElementById('settings-profile-name').value.trim();
    if (!newName) return;
    await supabase.from('coop_profiles').update({ full_name: newName }).eq('id', state.sessionUser.id);
    alert("Identity sync complete!");
    await syncUserProfileAndGroupRole();
}

function copyInviteLink() {
    if (!state.currentGroup.id) return;
    const inviteLink = `${window.location.origin}${window.location.pathname}?group=${state.currentGroup.id}`;
    navigator.clipboard.writeText(inviteLink).then(() => alert("📋 Shareable circle link copied to clipboard!"));
}

async function handleCreateGroupWizard() {
    const customName = prompt("✨ Name your new Peer-to-Peer Circle:");
    if (!customName || !customName.trim()) return;

    const customAmount = prompt("💰 Specify the round contribution goal amount (₦):", "50000");
    const formattedAmount = parseInt(customAmount) || 50000;

    const generatedGroupId = "CIRCLE-" + Math.random().toString(36).substring(2, 9).toUpperCase();

    const { error } = await supabase
        .from('coop_groups')
        .insert([{
            id: generatedGroupId,
            group_name: customName.trim(),
            contribution_amount: formattedAmount,
            current_round: 1,
            created_by: state.sessionUser.id,
            description: "Custom decentralized savings agenda portfolio tracking block."
        }]);

    if (!error) {
        alert(`🎯 Workspace loop created successfully!`);
        await switchCircleWorkspace(generatedGroupId);
    }
}