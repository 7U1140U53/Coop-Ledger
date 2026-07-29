# Database Tables

**Version:** 1.0.0  
**Last Updated:** 2026-07-26

---

# Overview

The Coop Ledger database consists of four core tables that manage user profiles, cooperative groups, group membership, and contribution records.

| Table                | Purpose                                                            |
| -------------------- | ------------------------------------------------------------------ |
| `coop_profiles`      | Stores user profile information linked to Supabase Authentication. |
| `coop_groups`        | Stores cooperative savings groups.                                 |
| `coop_group_members` | Maps users to cooperative groups.                                  |
| `coop_contributions` | Stores contribution transactions made by members.                  |

---

# Table: coop_profiles

## Description

Stores application-specific profile information for authenticated users.

## Primary Key

| Column | Type |
| ------ | ---- |
| id     | UUID |

## Columns

| Column     | Type        | Nullable | Default |
| ---------- | ----------- | -------- | ------- |
| id         | UUID        | No       | —       |
| full_name  | TEXT        | Yes      | —       |
| role       | TEXT        | Yes      | MEMBER  |
| created_at | TIMESTAMPTZ | Yes      | now()   |

---

# Table: coop_groups

## Description

Stores cooperative savings groups and their configuration.

## Primary Key

| Column | Type |
| ------ | ---- |
| id     | TEXT |

## Columns

| Column              | Type        | Nullable | Default                          |
| ------------------- | ----------- | -------- | -------------------------------- |
| id                  | TEXT        | No       | Generated Group ID               |
| group_name          | TEXT        | No       | —                                |
| contribution_amount | NUMERIC     | No       | 50000                            |
| current_round       | INTEGER     | No       | 1                                |
| created_by          | UUID        | Yes      | —                                |
| description         | TEXT        | Yes      | Savings and contribution circle. |
| is_archived         | BOOLEAN     | No       | FALSE                            |
| created_at          | TIMESTAMPTZ | Yes      | now()                            |

---

# Table: coop_group_members

## Description

Associates users with cooperative groups.

## Primary Key

| Column | Type   |
| ------ | ------ |
| id     | BIGINT |

## Columns

| Column     | Type        | Nullable | Default  |
| ---------- | ----------- | -------- | -------- |
| id         | BIGINT      | No       | Identity |
| group_id   | TEXT        | No       | —        |
| user_id    | UUID        | No       | —        |
| created_at | TIMESTAMPTZ | Yes      | now()    |

---

# Table: coop_contributions

## Description

Stores contribution records submitted by cooperative members.

## Primary Key

| Column | Type   |
| ------ | ------ |
| id     | BIGINT |

## Columns

| Column              | Type        | Nullable | Default              |
| ------------------- | ----------- | -------- | -------------------- |
| id                  | BIGINT      | No       | Identity             |
| member_id           | UUID        | No       | —                    |
| group_id            | TEXT        | No       | —                    |
| round_number        | INTEGER     | No       | —                    |
| amount              | NUMERIC     | No       | —                    |
| sender_bank_name    | TEXT        | Yes      | —                    |
| sender_account_name | TEXT        | Yes      | —                    |
| payment_reference   | TEXT        | No       | —                    |
| status              | TEXT        | No       | PENDING_VERIFICATION |
| created_at          | TIMESTAMPTZ | Yes      | now()                |

---

# Summary

| Item                       | Count |
| -------------------------- | ----: |
| Tables                     |     4 |
| Identity Columns           |     2 |
| Primary Keys               |     4 |
| Foreign Keys               |     6 |
| Row Level Security Enabled |   Yes |
