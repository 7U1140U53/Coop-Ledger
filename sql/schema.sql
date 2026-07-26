/*
===============================================================================
Coop Ledger Database Schema
===============================================================================

Schema      : coop_ledger
Database    : PostgreSQL (Supabase)
Version     : 1.0.0
Verified On : 2026-07-26

Description
-----------
Canonical database schema for the Coop Ledger application.

This file documents the current implementation of the database.

Migration history is maintained separately under:

    supabase/migrations/

Authentication identities are managed by:

    auth.users

===============================================================================
*/

CREATE SCHEMA IF NOT EXISTS coop_ledger;

-- =============================================================================
-- TABLE: coop_profiles
-- =============================================================================

CREATE TABLE coop_ledger.coop_profiles (

    id UUID NOT NULL,

    full_name TEXT,

    role TEXT DEFAULT 'MEMBER',

    created_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT coop_profiles_pkey
        PRIMARY KEY (id),

    CONSTRAINT coop_profiles_id_fkey
        FOREIGN KEY (id)
        REFERENCES auth.users(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_profile_role
        CHECK (
            role IN (
                'MEMBER',
                'TREASURER'
            )
        )

);

-- =============================================================================
-- TABLE: coop_groups
-- =============================================================================

CREATE TABLE coop_ledger.coop_groups (

    id TEXT NOT NULL
        DEFAULT (
            'GROUP-' ||
            upper(substring(md5(random()::text) FROM 1 FOR 6))
        ),

    group_name TEXT NOT NULL,

    contribution_amount NUMERIC NOT NULL
        DEFAULT 50000,

    current_round INTEGER NOT NULL
        DEFAULT 1,

    created_by UUID,

    description TEXT
        DEFAULT 'Savings and contribution circle.',

    is_archived BOOLEAN NOT NULL
        DEFAULT FALSE,

    created_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT coop_groups_pkey
        PRIMARY KEY (id),

    CONSTRAINT coop_groups_created_by_fkey
        FOREIGN KEY (created_by)
        REFERENCES auth.users(id)
        ON DELETE SET NULL,

    CONSTRAINT chk_positive_group_amount
        CHECK (
            contribution_amount > 0
        ),

    CONSTRAINT chk_current_round
        CHECK (
            current_round >= 1
        )

);

-- =============================================================================
-- TABLE: coop_group_members
-- =============================================================================

CREATE TABLE coop_ledger.coop_group_members (

    id BIGINT GENERATED ALWAYS AS IDENTITY,

    group_id TEXT NOT NULL,

    user_id UUID NOT NULL,

    created_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT coop_group_members_pkey
        PRIMARY KEY (id),

    CONSTRAINT coop_group_members_group_id_fkey
        FOREIGN KEY (group_id)
        REFERENCES coop_ledger.coop_groups(id)
        ON DELETE CASCADE,

    CONSTRAINT coop_group_members_user_id_fkey
        FOREIGN KEY (user_id)
        REFERENCES auth.users(id)
        ON DELETE CASCADE,

    CONSTRAINT unique_group_member
        UNIQUE (group_id, user_id)

);

-- =============================================================================
-- TABLE: coop_contributions
-- =============================================================================

CREATE TABLE coop_ledger.coop_contributions (

    id BIGINT GENERATED ALWAYS AS IDENTITY,

    member_id UUID NOT NULL,

    group_id TEXT NOT NULL,

    round_number INTEGER NOT NULL,

    amount NUMERIC NOT NULL,

    sender_bank_name TEXT,

    sender_account_name TEXT,

    payment_reference TEXT NOT NULL,

    status TEXT NOT NULL
        DEFAULT 'PENDING_VERIFICATION',

    created_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT coop_contributions_pkey
        PRIMARY KEY (id),

    CONSTRAINT coop_contributions_member_id_fkey
        FOREIGN KEY (member_id)
        REFERENCES coop_ledger.coop_profiles(id)
        ON DELETE CASCADE,

    CONSTRAINT coop_contributions_group_id_fkey
        FOREIGN KEY (group_id)
        REFERENCES coop_ledger.coop_groups(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_positive_contribution_amount
        CHECK (
            amount > 0
        ),

    CONSTRAINT chk_contribution_status
        CHECK (
            status IN (
                'PENDING_VERIFICATION',
                'APPROVED',
                'REJECTED'
            )
        )

);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE UNIQUE INDEX coop_profiles_pkey
    ON coop_ledger.coop_profiles(id);

CREATE UNIQUE INDEX coop_groups_pkey
    ON coop_ledger.coop_groups(id);

CREATE UNIQUE INDEX coop_group_members_pkey
    ON coop_ledger.coop_group_members(id);

CREATE UNIQUE INDEX coop_contributions_pkey
    ON coop_ledger.coop_contributions(id);

CREATE UNIQUE INDEX unique_group_member
    ON coop_ledger.coop_group_members(group_id, user_id);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE coop_ledger.coop_profiles
    ENABLE ROW LEVEL SECURITY;

ALTER TABLE coop_ledger.coop_groups
    ENABLE ROW LEVEL SECURITY;

ALTER TABLE coop_ledger.coop_group_members
    ENABLE ROW LEVEL SECURITY;

ALTER TABLE coop_ledger.coop_contributions
    ENABLE ROW LEVEL SECURITY;

-- Policy definitions are maintained in:
-- sql/rls_policies.sql

/*
===============================================================================
SCHEMA SUMMARY
===============================================================================

Tables
------
• coop_profiles
• coop_groups
• coop_group_members
• coop_contributions

Primary Keys       : 4
Foreign Keys       : 6
CHECK Constraints  : 5
Unique Constraints : 1
Indexes            : 5

Row Level Security
------------------
Enabled on all tables.

Functions
---------
None

Triggers
--------
None

Views
-----
None

Verified Against Live Database
------------------------------
2026-07-26

===============================================================================
*/