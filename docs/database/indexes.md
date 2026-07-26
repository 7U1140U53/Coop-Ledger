# Database Indexes

**Version:** 1.0.0  
**Last Updated:** 2026-07-26

---

# Overview

The Coop Ledger database uses primary key indexes and one composite unique index to maintain data integrity and optimize lookups.

---

# Indexes

| Index | Type | Table |
|--------|------|-------|
| coop_profiles_pkey | Primary Key | coop_profiles |
| coop_groups_pkey | Primary Key | coop_groups |
| coop_group_members_pkey | Primary Key | coop_group_members |
| coop_contributions_pkey | Primary Key | coop_contributions |
| unique_group_member | Unique Composite | coop_group_members |

---

# Composite Unique Index

## unique_group_member

Columns:

- group_id
- user_id

Purpose:

Ensures a user cannot be added to the same cooperative group more than once.

---

# Summary

| Item | Count |
|------|------:|
| Primary Key Indexes | 4 |
| Unique Composite Indexes | 1 |
| Total Indexes | 5 |