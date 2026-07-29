# Row Level Security (RLS)

**Version:** 1.0.0  
**Last Updated:** 2026-07-26

---

# Overview

Row Level Security (RLS) is enabled on every application table within the `coop_ledger` schema.

Policy definitions are maintained in:

`sql/rls_policies.sql`

---

# RLS Status

| Table              | RLS Enabled |
| ------------------ | ----------- |
| coop_profiles      | Yes         |
| coop_groups        | Yes         |
| coop_group_members | Yes         |
| coop_contributions | Yes         |

---

# Policy Summary

## coop_profiles

- Allow authenticated users to view profiles
- Allow users to manage their own profile

---

## coop_groups

- Allow authenticated users to create groups
- Allow members to view their groups
- Allow treasurers to update their groups

---

## coop_group_members

- Allow users to join groups via invite
- coop_group_members_insert_policy
- coop_group_members_select_policy

---

## coop_contributions

- Allow authenticated users to post contributions
- Allow members to view circle ledgers
- Treasurer can review contributions

---

# Summary

| Item             | Count |
| ---------------- | ----: |
| Tables Protected |     4 |
| Policies         |    11 |
| RLS Enabled      |   Yes |
