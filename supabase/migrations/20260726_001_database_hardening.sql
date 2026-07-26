/*
------------------------------------------------------------
Migration: Database Hardening
Date: 2026-07-26
Version: 1.0.0

Purpose
-------
Strengthen database integrity by enforcing mandatory
relationships and business rules.

Changes
-------
• Enforce mandatory foreign key columns (NOT NULL)
• Enforce valid profile roles
• Enforce valid contribution statuses
• Enforce positive monetary values
• Prevent invalid contribution rounds

Notes
-----
This migration reflects the verified implementation of the
live Coop Ledger database as of 2026-07-26.

Author
------
Olakunle Fayemiwo
------------------------------------------------------------
*/

-- ==========================================================
-- Section 1: Required Relationships
-- ==========================================================

ALTER TABLE coop_ledger.coop_group_members
    ALTER COLUMN group_id SET NOT NULL;

ALTER TABLE coop_ledger.coop_group_members
    ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE coop_ledger.coop_contributions
    ALTER COLUMN member_id SET NOT NULL;

ALTER TABLE coop_ledger.coop_contributions
    ALTER COLUMN group_id SET NOT NULL;


-- ==========================================================
-- Section 2: Business Rule Constraints
-- ==========================================================

ALTER TABLE coop_ledger.coop_profiles
ADD CONSTRAINT chk_profile_role
CHECK (
    role IN (
        'MEMBER',
        'TREASURER'
    )
);

ALTER TABLE coop_ledger.coop_contributions
ADD CONSTRAINT chk_contribution_status
CHECK (
    status IN (
        'PENDING_VERIFICATION',
        'APPROVED',
        'REJECTED'
    )
);


-- ==========================================================
-- Section 3: Financial Integrity
-- ==========================================================

ALTER TABLE coop_ledger.coop_contributions
ADD CONSTRAINT chk_positive_contribution_amount
CHECK (
    amount > 0
);

ALTER TABLE coop_ledger.coop_groups
ADD CONSTRAINT chk_positive_group_amount
CHECK (
    contribution_amount > 0
);

ALTER TABLE coop_ledger.coop_groups
ADD CONSTRAINT chk_current_round
CHECK (
    current_round >= 1
);

/*
------------------------------------------------------------
End of Migration
------------------------------------------------------------
*/