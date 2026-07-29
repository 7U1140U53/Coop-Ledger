# Database Constraints

**Schema:** `coop_ledger`

This document describes all database constraints used to enforce data integrity within the Coop Ledger database.

---

# Primary Keys

| Table              | Constraint              | Column |
| ------------------ | ----------------------- | ------ |
| coop_profiles      | coop_profiles_pkey      | id     |
| coop_groups        | coop_groups_pkey        | id     |
| coop_group_members | coop_group_members_pkey | id     |
| coop_contributions | coop_contributions_pkey | id     |

---

# Foreign Keys

| Table              | Constraint                        | References        | On Delete |
| ------------------ | --------------------------------- | ----------------- | --------- |
| coop_profiles      | coop_profiles_id_fkey             | auth.users(id)    | CASCADE   |
| coop_groups        | coop_groups_created_by_fkey       | auth.users(id)    | SET NULL  |
| coop_group_members | coop_group_members_group_id_fkey  | coop_groups(id)   | CASCADE   |
| coop_group_members | coop_group_members_user_id_fkey   | auth.users(id)    | CASCADE   |
| coop_contributions | coop_contributions_group_id_fkey  | coop_groups(id)   | CASCADE   |
| coop_contributions | coop_contributions_member_id_fkey | coop_profiles(id) | CASCADE   |

---

# Unique Constraints

| Table              | Constraint          | Definition          |
| ------------------ | ------------------- | ------------------- |
| coop_group_members | unique_group_member | (group_id, user_id) |

This constraint prevents the same user from joining the same cooperative group more than once.

---

# CHECK Constraints

## Profile Roles

Constraint

```
chk_profile_role
```

Rule

```sql
role IN ('MEMBER', 'TREASURER')
```

Ensures only supported application roles can be stored.

---

## Contribution Status

Constraint

```
chk_contribution_status
```

Rule

```sql
status IN (
    'PENDING_VERIFICATION',
    'APPROVED',
    'REJECTED'
)
```

Ensures contribution records remain in a valid workflow state.

---

## Positive Contribution Amount

Constraint

```
chk_positive_contribution_amount
```

Rule

```sql
amount > 0
```

Prevents zero or negative contribution values.

---

## Positive Group Contribution Amount

Constraint

```
chk_positive_group_amount
```

Rule

```sql
contribution_amount > 0
```

Ensures each cooperative group has a valid contribution amount.

---

## Current Round Validation

Constraint

```
chk_current_round
```

Rule

```sql
current_round >= 1
```

Prevents invalid contribution round numbers.

---

# NOT NULL Enforcement

The following foreign key columns are mandatory.

| Table              | Column    |
| ------------------ | --------- |
| coop_group_members | group_id  |
| coop_group_members | user_id   |
| coop_contributions | group_id  |
| coop_contributions | member_id |

This prevents orphaned relationships and guarantees referential integrity.

---

# Summary

The Coop Ledger database enforces integrity through:

- Primary key constraints
- Foreign key constraints
- Unique constraints
- CHECK constraints
- NOT NULL constraints

Together these constraints ensure the database maintains valid relationships and business rules independently of the application layer.
