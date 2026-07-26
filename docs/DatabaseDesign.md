# Database Design

**Project:** Coop Ledger  
**Document Version:** 2.0  
**Database Platform:** PostgreSQL (Supabase)  
**Application Schema:** `coop_ledger`  
**Last Updated:** 2026-07-26

---

# 1. Purpose

The Coop Ledger database serves as the persistent storage layer for the application, providing a secure and reliable foundation for managing cooperative savings groups, memberships, user profiles, and financial contributions.

The database is designed to preserve data integrity through PostgreSQL's native relational capabilities while integrating seamlessly with Supabase Authentication for user identity management. Business rules are enforced directly within the database through constraints and Row Level Security (RLS), reducing reliance on application-layer validation and ensuring consistent behavior regardless of the client interacting with the database.

Rather than functioning solely as a storage repository, the database actively protects the integrity, consistency, and security of application data by enforcing relationships, validating business rules, and restricting unauthorized access.

This document provides the architectural overview of the database design. Detailed implementation references are maintained in dedicated database documentation files to improve maintainability and avoid duplication.

---

# 2. Design Objectives

The Coop Ledger database was designed around the following objectives.

## 2.1 Data Integrity

Maintain accurate and consistent data through the use of primary keys, foreign keys, unique constraints, CHECK constraints, and NOT NULL constraints.

## 2.2 Security

Protect application data using PostgreSQL Row Level Security integrated with Supabase Authentication to ensure users access only data they are authorized to view or modify.

## 2.3 Maintainability

Separate business entities into well-defined relational tables that minimize redundancy and simplify future schema evolution.

## 2.4 Scalability

Provide a database structure capable of supporting future features such as reporting, analytics, auditing, notifications, and expanded cooperative management without requiring major architectural changes.

## 2.5 Performance

Use appropriate indexing strategies and normalized relationships to support efficient querying while preserving data integrity.

---

# 3. Database Architecture

## 3.1 Overview

The Coop Ledger application uses PostgreSQL as its relational database management system, hosted on Supabase.

Application data is isolated within a dedicated PostgreSQL schema named `coop_ledger`, while user authentication is managed independently through Supabase Authentication (`auth.users`).

This separation follows Supabase best practices by distinguishing authentication concerns from application-specific business data.

---

## 3.2 Schema Organization

The current implementation consists of two primary schemas.

| Schema | Responsibility |
|---------|----------------|
| `auth` | Managed by Supabase Authentication for user identities |
| `coop_ledger` | Stores all application-specific business data |

The application interacts directly with the `coop_ledger` schema while referencing authenticated users through foreign key relationships to `auth.users`.

---

## 3.3 Core Business Entities

The database currently consists of four core application tables.

| Table | Purpose |
|---------|---------|
| `coop_profiles` | Stores application profile information for authenticated users |
| `coop_groups` | Stores cooperative savings groups |
| `coop_group_members` | Represents membership relationships between users and cooperative groups |
| `coop_contributions` | Stores contribution records submitted by cooperative members |

Each table represents a single business entity and performs one clearly defined responsibility within the application.

---

## 3.4 Authentication Architecture

Authentication is fully delegated to Supabase Authentication.

Rather than storing authentication information inside application tables, the database extends authenticated users through the `coop_profiles` table.

This architecture provides several benefits:

- Authentication remains managed by Supabase.
- Business data remains independent of authentication records.
- Additional profile information can be introduced without modifying authentication structures.
- User lifecycle management is simplified through foreign key relationships.

---

## 3.5 Database Principles

The database design follows several architectural principles.

### Separation of Concerns

Authentication data remains within Supabase while application data resides exclusively within the `coop_ledger` schema.

### Relational Integrity

All business relationships are enforced through foreign key constraints.

### Database-Level Validation

Business rules are enforced using PostgreSQL constraints instead of relying exclusively on application logic.

### Security by Design

Authorization is enforced using PostgreSQL Row Level Security rather than depending solely on API validation.

### Modular Documentation

Database implementation details are maintained in dedicated reference documents to reduce duplication and simplify maintenance.

---

# 4. Schema Overview

The `coop_ledger` schema contains all application-specific database objects required by the Coop Ledger application.

The schema currently consists of four relational tables that collectively support user management, cooperative administration, membership management, and contribution tracking.

| Table | Description |
|---------|-------------|
| `coop_profiles` | Stores application profile information for authenticated users. |
| `coop_groups` | Stores cooperative savings groups and configuration. |
| `coop_group_members` | Maintains membership relationships between users and groups. |
| `coop_contributions` | Stores contribution transactions submitted by cooperative members. |

The schema follows a normalized relational design that minimizes redundancy while maintaining strong referential integrity between entities.

Detailed schema definitions are maintained separately in:

- `sql/schema.sql`

---

# 5. Entity Design

The Coop Ledger database models four primary business entities.

## 5.1 User Profiles

The `coop_profiles` table extends Supabase Authentication by storing application-specific profile information.

Each authenticated user has one corresponding application profile, creating a one-to-one relationship between `auth.users` and `coop_profiles`.

Primary responsibilities include:

- Storing application profile information.
- Maintaining application roles.
- Providing identity information throughout the application.
- Acting as the parent entity for contribution records.

---

## 5.2 Cooperative Groups

The `coop_groups` table represents cooperative savings groups created within the application.

Each cooperative group contains configuration information including contribution amounts, current contribution rounds, ownership information, and descriptive metadata.

Primary responsibilities include:

- Managing cooperative groups.
- Recording group ownership.
- Defining contribution configuration.
- Serving as the parent entity for memberships and contributions.

---

## 5.3 Group Memberships

The `coop_group_members` table implements the many-to-many relationship between users and cooperative groups.

Memberships are maintained independently from groups, allowing users to participate in multiple cooperatives while preserving normalization.

Primary responsibilities include:

- Recording memberships.
- Preventing duplicate memberships.
- Associating authenticated users with cooperative groups.

A composite unique constraint ensures a user cannot join the same cooperative group more than once.

---

## 5.4 Contributions

The `coop_contributions` table stores contribution transactions submitted by cooperative members.

Each contribution references both a member profile and a cooperative group, providing a complete historical record of financial activity.

Primary responsibilities include:

- Recording contribution transactions.
- Tracking contribution status.
- Maintaining contribution history.
- Supporting financial reconciliation and reporting.

Detailed table definitions are maintained separately in:

- `docs/database/tables.md`

# 6. Relationship Design

The Coop Ledger database follows a normalized relational model in which each business entity is connected through well-defined foreign key relationships.

These relationships ensure that data remains consistent throughout the application while allowing PostgreSQL to enforce referential integrity automatically.

The database currently contains six foreign key relationships.

| Parent Table | Child Table | Relationship |
|--------------|-------------|--------------|
| `auth.users` | `coop_profiles` | One-to-One |
| `auth.users` | `coop_groups` | One-to-Many |
| `coop_groups` | `coop_group_members` | One-to-Many |
| `auth.users` | `coop_group_members` | One-to-Many |
| `coop_profiles` | `coop_contributions` | One-to-Many |
| `coop_groups` | `coop_contributions` | One-to-Many |

These relationships establish the following business rules:

- Every application profile belongs to an authenticated user.
- Every cooperative group has a creator.
- Every membership belongs to one authenticated user and one cooperative group.
- Every contribution belongs to a valid cooperative group.
- Every contribution belongs to a valid member profile.
- Cooperative groups may contain multiple members and multiple contributions.

Referential integrity is enforced entirely by PostgreSQL through foreign key constraints.

Detailed relationship documentation is maintained in:

- `docs/database/relationships.md`

---

# 7. Referential Integrity

Referential integrity ensures that relationships between tables remain valid throughout the lifetime of the application.

The Coop Ledger database uses foreign key constraints to prevent orphaned records and maintain consistency across all business entities.

The following foreign key relationships are enforced.

| Child Table | Parent Table | Delete Action |
|-------------|--------------|---------------|
| `coop_profiles` | `auth.users` | CASCADE |
| `coop_groups` | `auth.users` | SET NULL |
| `coop_group_members` | `coop_groups` | CASCADE |
| `coop_group_members` | `auth.users` | CASCADE |
| `coop_contributions` | `coop_profiles` | CASCADE |
| `coop_contributions` | `coop_groups` | CASCADE |

This strategy provides several benefits.

- Prevents invalid references between tables.
- Automatically removes dependent records where appropriate.
- Preserves historical ownership information when required.
- Simplifies application logic by allowing PostgreSQL to maintain relationship consistency.

Referential integrity is considered a core architectural component of the Coop Ledger database rather than an application concern.

---

# 8. Constraint Strategy

Business rules are enforced primarily at the database level using PostgreSQL constraints.

This approach ensures data remains valid regardless of the application, API, or administrative tool interacting with the database.

The current implementation uses five categories of constraints.

---

## 8.1 Primary Keys

Every application table defines a primary key.

Primary keys uniquely identify each record and provide the foundation for all relational connections.

Current implementation:

- `coop_profiles`
- `coop_groups`
- `coop_group_members`
- `coop_contributions`

---

## 8.2 Foreign Keys

Foreign keys enforce relationships between application entities and Supabase Authentication.

They prevent child records from referencing non-existent parent records while maintaining referential integrity throughout the database.

---

## 8.3 Unique Constraints

The database currently implements a composite unique constraint on:

- `group_id`
- `user_id`

This constraint prevents duplicate membership records and guarantees that a user cannot join the same cooperative group multiple times.

---

## 8.4 CHECK Constraints

CHECK constraints validate business rules directly within PostgreSQL.

Current validations include:

- Valid application roles.
- Valid contribution workflow statuses.
- Positive contribution amounts.
- Positive cooperative contribution amounts.
- Valid contribution round numbers.

These validations ensure that invalid business data cannot be inserted into the database.

---

## 8.5 NOT NULL Constraints

Required business information is protected using NOT NULL constraints.

These constraints prevent incomplete records by ensuring mandatory fields always contain valid values.

Examples include:

- Membership relationships.
- Contribution relationships.
- Financial amounts.
- Contribution identifiers.

Detailed constraint documentation is maintained in:

- `docs/database/constraints.md`

---

# 9. Row Level Security

The Coop Ledger database uses PostgreSQL Row Level Security (RLS) to enforce authorization directly within the database engine.

Rather than depending exclusively on application logic, every query is evaluated against security policies before data can be viewed, inserted, updated, or deleted.

This security model provides defense in depth by combining:

- Supabase Authentication
- PostgreSQL Row Level Security
- Foreign key relationships
- Database constraints

The implemented policies ensure:

- Users manage only their own profiles.
- Members view only cooperative groups to which they belong.
- Members submit contributions only for groups in which they are members.
- Members view only contribution records associated with their groups.
- Group creators manage only the cooperative groups they own.

Row Level Security is enabled on every application table within the `coop_ledger` schema.

Detailed RLS documentation is maintained in:

- `docs/database/rls.md`

Complete policy definitions are maintained separately in:

- `sql/rls_policies.sql`

---

# 10. Schema Reference

The canonical database schema is maintained separately from this architectural document.

Separating the executable schema from the design documentation improves maintainability while avoiding duplication.

The schema reference includes:

- Table definitions
- Column definitions
- Primary keys
- Foreign keys
- CHECK constraints
- Unique constraints
- Indexes
- Row Level Security configuration

Canonical schema:

- `sql/schema.sql`

Migration history is maintained separately under:

- `supabase/migrations/`

The schema file reflects the verified implementation of the live PostgreSQL database and serves as the authoritative structural reference for the application.

# 11. Database Objects

The current Coop Ledger database implementation intentionally maintains a simple architecture focused on relational integrity, security, and maintainability.

The database currently contains the following object types.

| Object Type | Status |
|-------------|--------|
| Tables | 4 |
| Primary Keys | Implemented |
| Foreign Keys | Implemented |
| CHECK Constraints | Implemented |
| Unique Constraints | Implemented |
| Indexes | Implemented |
| Row Level Security Policies | Implemented |
| Functions | None |
| Triggers | None |
| Views | None |
| Stored Procedures | None |

The absence of database functions, triggers, and stored procedures is an intentional design decision for the current version of the application. Business logic is implemented primarily within the application layer, while PostgreSQL is responsible for maintaining data integrity, enforcing relationships, validating business rules, and securing data through Row Level Security.

This approach reduces database complexity while providing a solid foundation for future enhancements.

---

# 12. Supporting Documentation

This document provides the architectural overview of the Coop Ledger database.

Detailed implementation information is maintained in dedicated reference documents to improve maintainability and reduce duplication.

| Document | Purpose |
|----------|---------|
| `sql/schema.sql` | Canonical database schema definition |
| `sql/rls_policies.sql` | PostgreSQL Row Level Security policies |
| `docs/database/tables.md` | Table definitions |
| `docs/database/relationships.md` | Foreign key relationships |
| `docs/database/constraints.md` | Database constraints |
| `docs/database/indexes.md` | Index definitions |
| `docs/database/rls.md` | Row Level Security overview |
| `docs/database/functions.md` | Database functions |
| `docs/database/triggers.md` | Database triggers |

Maintaining detailed implementation information separately allows this document to remain focused on database architecture while ensuring individual technical references remain easier to maintain.

---

# 13. Future Enhancements

The current database architecture provides a solid foundation for future expansion as application requirements evolve.

Potential future enhancements include:

## Reporting Views

Introduce database views to simplify reporting and dashboard queries.

## Stored Procedures

Implement stored procedures for complex business operations that benefit from transactional execution within PostgreSQL.

## Audit Logging

Introduce audit tables or audit triggers to maintain a complete history of critical business events.

## Performance Optimization

Add additional indexes based on production query analysis rather than anticipated usage.

## Materialized Views

Introduce materialized views to improve reporting performance for analytical workloads.

## Database Partitioning

Partition large contribution tables if transaction volume grows significantly over time.

## Automated Archiving

Implement archival strategies for historical contribution records while maintaining operational database performance.

Future enhancements will be implemented only when supported by measurable application requirements, production workloads, and performance analysis.

---

# 14. Design Principles

The Coop Ledger database has been designed according to the following principles.

### Data Integrity First

Business rules are enforced within PostgreSQL whenever practical through constraints and relational integrity.

### Security by Default

Authorization is enforced using PostgreSQL Row Level Security integrated with Supabase Authentication.

### Separation of Responsibilities

Authentication, application logic, and persistent business data remain clearly separated.

### Maintainability

Database objects are documented individually to simplify maintenance and reduce documentation duplication.

### Scalability

The relational model is designed to accommodate future application growth without requiring significant architectural redesign.

### Simplicity

The implementation intentionally avoids unnecessary database complexity while preserving extensibility for future development.

---

# 15. Summary

The Coop Ledger database provides a secure, normalized, and maintainable relational foundation for the application.

The design leverages PostgreSQL's native capabilities to enforce referential integrity, validate business rules, and secure application data while integrating seamlessly with Supabase Authentication.

Key characteristics of the implementation include:

- Dedicated application schema (`coop_ledger`)
- Normalized relational design
- Strong referential integrity
- Database-enforced business rules
- PostgreSQL Row Level Security
- Separation of authentication from business data
- Modular documentation structure
- Verified implementation against the live database

The database currently consists of four core business entities supported by foreign key relationships, database constraints, indexes, and Row Level Security policies.

As the application evolves, the database architecture is designed to accommodate additional reporting capabilities, performance optimizations, auditing features, and analytical workloads while preserving the principles of security, maintainability, and scalability.

---

## Revision History

| Version | Date | Description |
|---------|------|-------------|
| 1.0 | Initial Draft | Initial database design documentation |
| 2.0 | 2026-07-26 | Complete rewrite following live database verification, documentation restructuring, and schema audit. |