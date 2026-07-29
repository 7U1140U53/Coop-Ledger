# Architecture Diagrams

**Project:** Coop Ledger  
**Version:** 1.0  
**Last Updated:** 2026-07-26

---

# 1. Purpose

This document contains the architectural diagrams that illustrate the overall structure, component interactions, data flow, authentication process, database model, and deployment architecture of the Coop Ledger application.

These diagrams complement the information provided in **Architecture.md** and **DatabaseDesign.md**.

---

# 2. System Architecture

```mermaid
flowchart TD

A[User Browser]

A --> B[index.html]

B --> C[app.js]

C --> D[config.js]

C --> E[Supabase Client]

E --> F[Supabase Authentication]

E --> G[(PostgreSQL Database)]

G --> H[coop_profiles]

G --> I[coop_groups]

G --> J[coop_group_members]

G --> K[coop_contributions]
```

---

# 3. Application Component Diagram

```mermaid
graph LR

UI[User Interface]

UI --> AUTH[Authentication]

UI --> GROUPS[Group Management]

UI --> CONTRIBUTIONS[Contribution Management]

AUTH --> DB[(Database)]

GROUPS --> DB

CONTRIBUTIONS --> DB
```

---

# 4. Authentication Flow

```mermaid
sequenceDiagram

participant User

participant Browser

participant SupabaseAuth

participant Database

User->>Browser: Enter Credentials

Browser->>SupabaseAuth: Sign In Request

SupabaseAuth-->>Browser: Authentication Success

Browser->>Database: Request User Profile

Database-->>Browser: Profile Data

Browser-->>User: Dashboard
```

---

# 5. Group Membership Workflow

```mermaid
flowchart LR

A[User]

A --> B[Create Account]

B --> C[Login]

C --> D[Create or Join Group]

D --> E[Become Member]

E --> F[Submit Contributions]

F --> G[Contribution History]
```

---

# 6. Entity Relationship Overview

```mermaid
erDiagram

coop_profiles ||--o{ coop_groups : owns

coop_profiles ||--o{ coop_group_members : joins

coop_groups ||--o{ coop_group_members : contains

coop_profiles ||--o{ coop_contributions : makes

coop_groups ||--o{ coop_contributions : receives
```

---

# 7. Database Access Flow

```mermaid
flowchart LR

Browser

|

v

JavaScript Application

|

v

Supabase Client

|

v

Supabase Authentication

|

v

Row Level Security

|

v

PostgreSQL Database
```

---

# 8. Deployment Architecture

```mermaid
flowchart TD

Developer

|

v

GitHub Repository

|

v

Static Hosting

|

v

User Browser

|

v

Supabase Backend

|

|------ Authentication

|

|------ PostgreSQL Database
```

---

# 9. Documentation Relationships

```mermaid
graph TD

README

README --> ProjectOverview

README --> PRD

README --> Architecture

Architecture --> ArchitectureDiagram

Architecture --> DatabaseDesign

DatabaseDesign --> SQL

DatabaseDesign --> DatabaseDocs

SQL --> schema.sql

SQL --> rls_policies.sql

DatabaseDocs --> tables.md

DatabaseDocs --> relationships.md

DatabaseDocs --> constraints.md

DatabaseDocs --> indexes.md

DatabaseDocs --> rls.md

DatabaseDocs --> functions.md

DatabaseDocs --> triggers.md
```

---

# 10. Summary

These diagrams provide a visual representation of the Coop Ledger architecture, illustrating system structure, component interactions, authentication, database relationships, deployment, and supporting documentation. They serve as a quick reference for developers, reviewers, and future contributors.
