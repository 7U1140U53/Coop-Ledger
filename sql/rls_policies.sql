/*
===============================================================================
Coop Ledger Row Level Security Policies
===============================================================================

Schema      : coop_ledger
Database    : PostgreSQL (Supabase)
Version     : 1.0.0
Verified On : 2026-07-26

Description
-----------
This file contains all Row Level Security (RLS) policies
implemented in the Coop Ledger database.

===============================================================================
*/

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE coop_ledger.coop_profiles
    ENABLE ROW LEVEL SECURITY;

ALTER TABLE coop_ledger.coop_groups
    ENABLE ROW LEVEL SECURITY;

ALTER TABLE coop_ledger.coop_group_members
    ENABLE ROW LEVEL SECURITY;

ALTER TABLE coop_ledger.coop_contributions
    ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- TABLE: coop_profiles
-- ============================================================================

CREATE POLICY "Allow authenticated users to view profiles"
ON coop_ledger.coop_profiles
FOR SELECT
TO authenticated
USING (
    TRUE
);

CREATE POLICY "Allow users to manage their own profile"
ON coop_ledger.coop_profiles
FOR ALL
TO authenticated
USING (
    auth.uid() = id
)
WITH CHECK (
    auth.uid() = id
);

-- ============================================================================
-- TABLE: coop_groups
-- ============================================================================

CREATE POLICY "Allow authenticated users to create groups"
ON coop_ledger.coop_groups
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = created_by
);

CREATE POLICY "Allow members to view their groups"
ON coop_ledger.coop_groups
FOR SELECT
TO authenticated
USING (
    auth.uid() = created_by
    OR EXISTS (
        SELECT 1
        FROM coop_ledger.coop_group_members
        WHERE
            coop_group_members.group_id = coop_groups.id
            AND coop_group_members.user_id = auth.uid()
    )
);

CREATE POLICY "Allow treasurers to update their groups"
ON coop_ledger.coop_groups
FOR UPDATE
TO PUBLIC
USING (
    auth.uid() = created_by
)
WITH CHECK (
    auth.uid() = created_by
);

-- ============================================================================
-- TABLE: coop_group_members
-- ============================================================================

CREATE POLICY "Allow users to join groups via invite"
ON coop_ledger.coop_group_members
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = user_id
);

CREATE POLICY "coop_group_members_insert_policy"
ON coop_ledger.coop_group_members
FOR INSERT
TO PUBLIC
WITH CHECK (
    auth.uid() = user_id
);

CREATE POLICY "coop_group_members_select_policy"
ON coop_ledger.coop_group_members
FOR SELECT
TO PUBLIC
USING (
    auth.uid() = user_id
);

-- ============================================================================
-- TABLE: coop_contributions
-- ============================================================================

CREATE POLICY "Allow authenticated users to post contributions"
ON coop_ledger.coop_contributions
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM coop_ledger.coop_group_members
        WHERE
            coop_group_members.group_id = coop_contributions.group_id
            AND coop_group_members.user_id = auth.uid()
    )
);

CREATE POLICY "Allow members to view circle ledgers"
ON coop_ledger.coop_contributions
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM coop_ledger.coop_group_members
        WHERE
            coop_group_members.group_id = coop_contributions.group_id
            AND coop_group_members.user_id = auth.uid()
    )
);

CREATE POLICY "Treasurer can review contributions"
ON coop_ledger.coop_contributions
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM coop_ledger.coop_groups g
        WHERE
            g.id = coop_contributions.group_id
            AND g.created_by = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM coop_ledger.coop_groups g
        WHERE
            g.id = coop_contributions.group_id
            AND g.created_by = auth.uid()
    )
);

/*
===============================================================================
END OF FILE
===============================================================================
*/