# Database Relationships

**Version:** 1.0.0  
**Last Updated:** 2026-07-26

---

# Overview

The Coop Ledger database contains six foreign key relationships that maintain referential integrity between application tables and Supabase Authentication.

---

# Relationship Summary

| Parent Table  | Child Table        | Foreign Key | On Delete |
| ------------- | ------------------ | ----------- | --------- |
| auth.users    | coop_profiles      | id          | CASCADE   |
| auth.users    | coop_groups        | created_by  | SET NULL  |
| coop_groups   | coop_group_members | group_id    | CASCADE   |
| auth.users    | coop_group_members | user_id     | CASCADE   |
| coop_groups   | coop_contributions | group_id    | CASCADE   |
| coop_profiles | coop_contributions | member_id   | CASCADE   |

---

# Entity Relationships

## auth.users → coop_profiles

- One authenticated user owns one profile.
- Profile records are deleted automatically when the authentication record is removed.

---

## auth.users → coop_groups

- A user may create multiple cooperative groups.
- If the creator account is deleted, `created_by` is set to `NULL`.

---

## coop_groups → coop_group_members

- A group can contain many members.
- Deleting a group removes all membership records.

---

## auth.users → coop_group_members

- A user can belong to multiple groups.
- Removing a user removes all membership records.

---

## coop_groups → coop_contributions

- A group can contain many contribution records.
- Deleting a group removes all associated contributions.

---

## coop_profiles → coop_contributions

- A member can submit multiple contributions.
- Deleting a profile removes all associated contribution records.

---

# Summary

| Item             | Count |
| ---------------- | ----: |
| Foreign Keys     |     6 |
| Cascade Deletes  |     5 |
| SET NULL Actions |     1 |
