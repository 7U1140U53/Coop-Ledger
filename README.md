```markdown
# CoreLedger Co-op (Coop Ledger)

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](https://opensource.org/licenses/MIT)
[![Stack: Vanilla JS](https://img.shields.io/badge/Stack-Vanilla%20JS-slate.svg)](#)
[![Database: Supabase](https://img.shields.io/badge/Database-Supabase-blueviolet.svg)](#)
[![Context: Nigeria Optimization](https://img.shields.io/badge/Context-Nigeria%20Optimization-yellow.svg)](#)

A sleek, premium, context-optimized financial ledger and automated reconciliation workspace tailored for rotating savings schemes, cooperative societies, investment clubs, and **Ajo/Esusu/Adashi** syndicates in the Nigerian macroeconomic landscape.

This platform completely re-imagines cooperative wealth pooling by bypassing traditional Western card/direct-debit infrastructure. Instead, it optimizes for the reality of rapid local bank payments (NIP, USSD, instant transfers via OPay, Moniepoint, PalmPay, GTBank, Zenith, etc.) by matching a frictionless contributor deposit logging dashboard with an unalterable, single-click verification queue for Treasurers.

---

## 🗺️ The Problem Space & Solution Architecture

### The Friction
In Nigeria, micro-cooperatives and contribution circles move capital swiftly via instant bank transfers. However, tracking these pools is fractured across unstructured WhatsApp groups, messy chat threads, and manual spreadsheet lookups. Treasurers spend hours matching generic bank alerts (e.g., `TRF FROM CHINEDU`) to individual members. This leads to:
* **Administrative Fatigue:** Manual cross-referencing is error-prone and leads to bookkeeping backlogs.
* **Trust Degradation:** Members lack an authoritative, transparent view of pool metrics, cycles, and penalties.
* **Opaque Inflows:** Tracking outstanding balances, late fees, and current pool totals requires constant manual calculations.

### The Solution
**CoreLedger Co-op** provides an elegant, 90-second onboarding and submission flow:
1. **Members** run a standard local bank app/USSD transfer, log the official payment reference code directly on their dashboard, and lock their entry to eliminate double-submitting.
2. **Treasurers** review an isolated clearing desk queue. A single-click verifies the transaction against their live bank terminal statement, updates balances across the pool instantly, and locks the ledger row.
3. **The System** updates metrics globally and fires simulated telemetry updates indicating if any members require reminders.

---

## ⚡ Key Product Capabilities

* **Multi-Circle Workspace Matrix:** Switch fluidly between completely isolated savings streams or historical pools using an immersive slide-out deck or directly via deep-linked invite parameters (`?group=uuid`).
* **Instant Invite-Link Onboarding:** When a new user hits a shared link with an active group parameter, the system automatically hooks their profile up to the target cooperative junction table instantly.
* **Bulletproof Contribution Lifecycle:** Driven by a finite state machine. Contribution fields remain locked during verification to preserve systemic data integrity.
* **Private Treasurer Desk:** Advanced administrative views automatically display for group managers, facilitating single-click transaction approvals or database row deletions.
* **Simulated WhatsApp Telemetry Reminders:** Built-in dashboard console tracking that broadcasts automated circular notifications and late warnings to members when a savings round is force-closed by a manager.
* **Premium Minimalist UI:** Designed with an ultra-clean, high-end "SaaS style" dark layout featuring smooth fade animations, indicator glows, and glassmorphism cards powered entirely by responsive Tailwind CSS utility wrappers.

---

## 🔄 The Contribution Finite State Machine

To guarantee data consistency and eliminate financial ledger corruption, every ledger log adheres to strict systemic validation parameters:

[ Contributor Logs Bank Transfer Reference ]
                     │
                     ▼
        State: PENDING_VERIFICATION
     ┌─────────────────────────────────┐
     │ • UI Badge: Amber Glow          │
     │ • Member Form: Inputs LOCKED    │
     │ • Queue Desk: Appears to Admin  │
     └────────────────┬────────────────┘
                      │
        ┌─────────────┴─────────────┐
        ▼                           ▼
 [ Admin: Click Approve ]    [ Admin: Click Delete ]
        │                           │
        ▼                           ▼
   State: APPROVED            State: DELETED
 ┌─────────────────────────┐ ┌─────────────────────────┐
 │ • UI Badge: Green Glow  │ │ • Row removed from database
 │ • Record: PERMA-LOCKED  │ │ • Member Form: UNLOCKED │
 │ • Pool Balance: Updated │ │ • Re-submission: Allowed│
 └─────────────────────────┘ └─────────────────────────┘

1. **`PENDING_VERIFICATION` (Amber)**
   * *Trigger:* Contributor submits a deposit form containing their unique bank reference hash.
   * *Invariants:* Dashboard inputs freeze instantly. The user is locked out from editing that specific entry while the entry populates the pending audit view on the Treasurer Desk.
2. **`APPROVED` (Green)**
   * *Trigger:* Treasurer clicks "Approve" after verifying funds in their bank terminal.
   * *Invariants:* The entry moves permanently to archival history, total pool aggregates increment, and the transaction details freeze against any future mutations.
3. **`DELETED` (Form Reset)**
   * *Trigger:* Treasurer clicks "Delete" because of a mismatch (illegible tracking reference, unconfirmed alert, incorrect sum).
   * *Invariants:* The broken tracking record is safely expunged, alerting the member dashboard and unlocking the deposit submission block for active corrections.

---

## 🗄️ Supabase Relational Database Schema

The system uses PostgreSQL isolation rules. Run the following DDL configuration script directly within your Supabase SQL Editor to wire up the core data layer.

> ⚠️ **Important Schema Definition:** The runtime application logic initializes connections utilizing an isolated database namespace titled `coop_ledger`. Make sure you create this schema or adjust your target policies before tables compilation.

```sql
-- 0. SCHEMA ISOLATION INITIALIZATION
CREATE SCHEMA IF NOT EXISTS coop_ledger;

-- 1. EXTENDED PROFILES TABLE
-- Maps authenticated users directly to their customizable identities
CREATE TABLE coop_ledger.coop_profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'MEMBER' CHECK (role IN ('MEMBER', 'TREASURER')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. SAVINGS GROUPS TABLE
-- Houses core operational parameters for specific contribution syndicates
CREATE TABLE coop_ledger.coop_groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_name TEXT NOT NULL,
    contribution_amount NUMERIC(12, 2) NOT NULL CHECK (contribution_amount > 0),
    current_round INT NOT NULL DEFAULT 1 CHECK (current_round >= 1),
    created_by UUID REFERENCES coop_ledger.coop_profiles(id) ON DELETE RESTRICT NOT NULL,
    description TEXT DEFAULT 'Savings and contribution circle.',
    is_archived BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. WORKSPACE JUNCTION TABLE
-- Maps many-to-many relationship tracking which users belong to which savings groups
CREATE TABLE coop_ledger.coop_group_members (
    group_id UUID REFERENCES coop_ledger.coop_groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES coop_ledger.coop_profiles(id) ON DELETE CASCADE,
    PRIMARY KEY (group_id, user_id)
);

-- 4. FINANCIAL CONTRIBUTIONS LEDGER
-- Records individual pool deposit inputs and validation tracking reference strings
CREATE TABLE coop_ledger.coop_contributions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id UUID REFERENCES coop_ledger.coop_profiles(id) ON DELETE RESTRICT NOT NULL,
    group_id UUID REFERENCES coop_ledger.coop_groups(id) ON DELETE CASCADE NOT NULL,
    round_number INT NOT NULL CHECK (round_number >= 1),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    sender_bank_name TEXT NOT NULL,
    sender_account_name TEXT NOT NULL,
    payment_reference TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING_VERIFICATION' NOT NULL 
        CHECK (status IN ('PENDING_VERIFICATION', 'APPROVED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    -- Invariant Guard: Prevent duplicate tracking records or multi-submitting identical bank reference tokens
    CONSTRAINT unique_group_round_member UNIQUE (group_id, round_number, member_id),
    CONSTRAINT unique_payment_reference UNIQUE (payment_reference)
);

-- 5. PERFORMANCE INDEX OPTIMIZATION
CREATE INDEX IF NOT EXISTS idx_contributions_lookup 
ON coop_ledger.coop_contributions(group_id, round_number, status);
📂 Project Structure
Plaintext
├── .gitignore                   # Excludes systems and configurations files
├── config.js                    # Global Supabase Edge credentials binder
├── index.html                   # Core semantic DOM markup & layout templates
├── app.js                       # Functional State Controller & Database Engine
├── style.css                    # Premium layout stylesheets & canvas colors
└── README.md                    # System documentation
🛠️ Local Installation & Technical Wiring
Follow this simple guide to deploy your workspace in a local development environment:

1. Clone the Files
Replicate this repository structure onto your local workstation:

Bash
git clone <your-repository-url>
cd coreledger-coop
2. Configure Your Supabase Instance
Set up a new project on Supabase Console.

Open the SQL Editor tab inside your Supabase project dashboard.

Paste the complete PostgreSQL schema script provided in the Supabase Relational Database Schema section above and click Run.

3. Connect the Frontend Client
Open config.js and input your real Supabase Project credentials. Both parameters can be retrieved under Project Settings -> API:

JavaScript
window.SUPABASE_CONFIG = {
    URL: "[https://your-project-id.supabase.co](https://your-project-id.supabase.co)",
    ANON_KEY: "your-supabase-anon-publishable-key"
};
4. Serve the Application
Since this project uses modern, clean Vanilla ES6 architecture without heavy node compilation framework overhead, you can serve it via any basic static server.

VS Code: Install the Live Server extension, right-click index.html, and choose Open with Live Server.

Python: Run the native local server command from your project root folder:

Bash
python -m http.server 8000
Open your browser and navigate to http://localhost:8000.

🛡️ RLS & Security Considerations
Because this application communicates directly with Supabase via client-side JavaScript (app.js), you must ensure that Row Level Security (RLS) is enabled for production environments to protect financial data integrity:

Authentication: User registration and access are handled securely via Supabase Auth inside initAuthListeners().

Schema Control: By passing { db: { schema: 'coop_ledger' } } during client instantiation, the application isolates transactions from default public visibility schemas.

RLS Policy Design Recommendations:

coop_profiles: Users should only be permitted to update rows matching their own authentication ID (auth.uid() = id).

coop_group_members: Read permissions should be granted exclusively if the authenticated user is listed as a member of the group.

coop_contributions: Insert permissions should be open to any active member, while update/delete rights must be restricted to the group creator (created_by) via explicit join statements.

📝 License
Distributed under the MIT License. See LICENSE for more information.
