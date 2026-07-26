# Developer Guide

**Project:** Coop Ledger  
**Version:** 1.0  
**Last Updated:** 2026-07-26

---

# 1. Introduction

This guide provides the information required to set up, understand, develop, and maintain the Coop Ledger application.

It is intended for software developers who contribute to the project and serves as the primary technical reference for the application's development workflow.

---

# 2. Technology Stack

| Component | Technology |
|----------|------------|
| Frontend | HTML5 |
| Styling | CSS3 |
| Client Logic | JavaScript (ES6) |
| Backend | Supabase |
| Database | PostgreSQL |
| Authentication | Supabase Authentication |
| Version Control | Git |
| Repository | GitHub |

---

# 3. Project Structure

```

Coop_LedgerMVP/
│
├── assets/
├── docs/
├── sql/
├── supabase/
│
├── app.js
├── config.js
├── index.html
├── style.css
└── README.md

```

---

# 4. Local Development

Clone the repository.

```bash
git clone <repository-url>
```

Open the project folder.

Configure the Supabase connection inside:

```

config.js

```

Launch the application using a local web server.

---

# 5. Configuration

Application configuration is stored within:

```

config.js

```

Developers should configure:

- Supabase URL
- Supabase Anon Key

Production credentials should never be committed to source control.

---

# 6. Database

The application uses PostgreSQL hosted on Supabase.

Reference documentation:

- DatabaseDesign.md
- sql/schema.sql
- sql/rls_policies.sql
- docs/database/

---

# 7. Authentication

Authentication is provided by Supabase Authentication.

Application profile information is stored separately inside the `coop_profiles` table.

Authentication should never be implemented independently of Supabase.

---

# 8. Coding Standards

Developers should follow these principles.

- Keep functions small and focused.
- Use meaningful variable names.
- Avoid duplicated logic.
- Prefer readable code over clever code.
- Document significant architectural decisions.
- Maintain consistent formatting.

---

# 9. Database Changes

All database modifications must be implemented using versioned migration files.

Migration files are stored in:

```

supabase/migrations/

```

Database documentation must be updated whenever the schema changes.

---

# 10. Testing

Before committing changes, developers should verify:

- Authentication
- Group creation
- Membership management
- Contribution submission
- Database integrity
- Row Level Security

---

# 11. Documentation

The following documentation should be updated whenever relevant changes are made.

- README.md
- PRD.md
- Architecture.md
- DatabaseDesign.md
- Database documentation
- CHANGELOG.md

---

# 12. Version Control

Recommended Git workflow:

- Create a feature branch.
- Implement changes.
- Test locally.
- Update documentation.
- Commit with descriptive messages.
- Merge into the main branch after review.

---

# 13. Summary

This guide provides the development standards and technical workflow for maintaining the Coop Ledger application. Following these practices helps ensure consistency, maintainability, and long-term project quality.