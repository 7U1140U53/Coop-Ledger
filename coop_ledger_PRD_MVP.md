import os

prd_content = """# Product Requirement Document (PRD)
## Project: CoreLedger Co-op (Nigerian Context Optimization)
### Document Version: 1.0 (MVP Scope)
### Status: Approved for Architecture Phase

---

## 1. Executive Summary & Problem Space

### 1.1 Core Friction
Cooperative financial management in Nigeria (covering Investment Clubs, Ajo/Esusu Syndicates, Staff Thrifting Societies, and Town Union Associations) is currently crippled by manual reconciliation processes. While funds move swiftly via instant bank transfers (NEFT/NIP, USSD, and fintech wallets like PalmPay, OPay, and Moniepoint), the tracking mechanism relies heavily on administrative memory, unstructured WhatsApp group receipts, and disparate bank statement exports. 

Treasurers (Admins) spend hours matching vague bank alerts (e.g., `TRANSFER FROM CHINEDU`) to actual members, resulting in:
* **Reconciliation Fatigue:** Manual cross-referencing causes human errors, lost entries, and delayed books.
* **Trust Degradation:** Members lack a single source of truth for their equity, resulting in friction and skepticism regarding management capabilities.
* **Pipeline Opacity:** Outstanding balances, late penalties, and pending inflows are invisible until calculated manually at the end of a cycle.

### 1.2 The "Why Now?" & MVP Value Proposition
In the current macroeconomic climate, cooperative capital pooling is surging as an alternative to traditional commercial banking credit channels. However, administrative overhead limits their growth. 

**CoreLedger Co-op** bypasses Western payment assumptions (automated direct debits, credit cards) to deliver a hyper-localized **Concierge MVP**. Within **90 seconds of logging in**, an Administrator can match a pending transfer to their physical bank ledger, lock the record, and automatically broadcast an updated, color-coded financial dashboard to the member. It prioritizes data integrity and visibility over expensive automation infrastructure.

---

## 2. User Personas & System Actors

### 2.1 The Contributor (Co-op Member)
* **Profile:** Active smartphone user, comfortable executing transfers via bank apps or USSD codes. 
* **Pain Points:** Wants instant proof that their payment has been recognized; dislikes chasing the Treasurer to verify if their money arrived; needs a clear view of their financial health/penalties to avoid cooperative social friction.
* **Primary Operational Goal:** Log a bank transfer quickly, attach visual evidence, and see their personal ledger update out of a red/amber state into green compliance.

### 2.2 The Administrator (Treasurer)
* **Profile:** Detail-oriented manager juggling co-op duties with a primary career. Operates on a desktop or tablet to reconcile transactions.
* **Pain Points:** Overwhelmed by WhatsApp receipt screenshots; struggles with matching uninformative bank statement narrations to specific members; fears double-entry bugs or accidental record deletions.
* **Primary Operational Goal:** Maintain a bulletproof, unalterable ledger with minimal administrative keystrokes, leveraging rapid action toggles to clear a queue of incoming verifications.

---

## 3. Core Business Logic & State-Driven Lifecycle

To prevent human error and create a scannable UI, all entries follow a strict finite state machine. A ledger record cannot be modified arbitrarily; it responds entirely to structural system state transitions.

   [ Member Action: Submit Transfer Form ]
                      │
                      ▼
       State: PENDING_VERIFICATION
     ┌─────────────────────────────────┐
     │ • Badge Color: Amber            │
     │ • Member Form: Inputs LOCKED    │
     │ • Admin Action: Approve / Flag  │
     └────────────────┬────────────────┘
                      │
        ┌─────────────┴─────────────┐
        ▼                           ▼
 [ Admin: Approve ]          [ Admin: Flag ]
        │                           │
        ▼                           ▼
 State: APPROVED             State: FLAGGED
┌─────────────────────────┐ ┌─────────────────────────┐
│ • Badge Color: Green    │ │ • Badge Color: Red      │
│ • Record: FULLY LOCKED  │ │ • Member Form: UNLOCKED │
│ • Balance: Mutated (+)  │ │ • Admin Notes: Appended │
└─────────────────────────┘ └─────────────────────────┘


### 3.1 State Definitions & UI Hook Rules
1. **`PENDING_VERIFICATION` (Amber)**
   * *Trigger:* Member completes the payment logging form.
   * *Data Invariant:* Database entry is created with a unique payment reference.
   * *UI Handling:* Member-facing input fields for this specific transaction are instantly grayed out and disabled to prevent double-submitting. Admin views this entry inside a specialized "Clearing Feed" with high-visibility action triggers.
2. **`APPROVED` (Green)**
   * *Trigger:* Admin clicks the `Approve` button after validating the transfer on their bank terminal.
   * *Data Invariant:* System timestamps `verified_at`, appends the Admin user ID, updates the member's core ledger balance, and permanently restricts any future updates or deletions on the row via database triggers/constraints.
   * *UI Handling:* Displays a permanent green "Verified" check token. The row disappears from the Admin clearing queue and transitions into the historical archival ledger view.
3. **`FLAGGED` (Red)**
   * *Trigger:* Admin clicks `Flag` due to a mismatch (e.g., incorrect transfer amount, bank screenshot illegible, no matching bank alert).
   * *Data Invariant:* System prompts for a mandatory `admin_notes` entry explaining the rejection. The row remains in the table but status changes.
   * *UI Handling:* High-contrast red notification badge appears on the Member's dashboard. The input form for this specific payment **re-unlocks**, permitting editing and re-submission by the member.

---

## 4. Technical Architecture & Database Schema

The MVP utilizes a secure, relational database backend (Supabase / PostgreSQL) optimized for immediate UI rendering and bulletproof data integrity.

### 4.1 Relational Schema Setup
```sql
-- Core user extension profile mapping to Supabase Auth users
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT NOT NULL,
    membership_id TEXT UNIQUE NOT NULL, -- Format: COOP-YYYY-XXXX (e.g., COOP-2026-0042)
    phone_number TEXT,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Target Cycles (e.g., "May 2026 Monthly Welfare Contribution")
CREATE TABLE public.contribution_cycles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    target_amount NUMERIC(12, 2) NOT NULL CHECK (target_amount >= 0),
    due_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL
);

-- Ledger Entries System
CREATE TABLE public.contributions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT NOT NULL,
    cycle_id UUID REFERENCES public.contribution_cycles(id) ON DELETE RESTRICT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    
    -- Localized Context Validation Inputs
    sender_bank_name TEXT NOT NULL,       -- e.g., 'Zenith Bank', 'GTBank', 'OPay'
    sender_account_name TEXT NOT NULL,    -- Exact name on the debit alert receipt
    payment_reference TEXT NOT NULL,      -- Bank Session ID, UTR, or reference hash
    receipt_storage_url TEXT NOT NULL,    -- Link to uploaded screenshot image in Supabase Bucket
    
    -- State Lifecycle Configuration
    status TEXT DEFAULT 'PENDING_VERIFICATION'::text NOT NULL 
        CHECK (status IN ('PENDING_VERIFICATION', 'APPROVED', 'FLAGGED')),
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
    
    -- Business Rule Constraint: Avoid accidental duplicate submission of the exact same reference code
    CONSTRAINT unique_payment_reference UNIQUE (payment_reference)
)