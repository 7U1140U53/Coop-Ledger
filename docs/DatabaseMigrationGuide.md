# Database Migration Guide

**Project:** Coop Ledger  
**Version:** 1.0  
**Last Updated:** 2026-07-26

---

# 1. Purpose

This guide defines the standards and procedures for managing database schema changes within the Coop Ledger project.

Database migrations provide a controlled, versioned approach to modifying the PostgreSQL database while maintaining data integrity and consistency across development and production environments.

---

# 2. Migration Principles

All database changes must be:

- Version controlled
- Reproducible
- Incremental
- Reversible where practical
- Documented
- Tested before deployment

Direct modifications to the production database should be avoided. All structural changes should be applied through migration scripts.

---

# 3. Migration Location

Migration files are stored in:

```
supabase/migrations/
```

Each migration should represent a single logical database change.

Example:

```
20260726_001_database_hardening.sql
20260730_002_add_indexes.sql
20260805_003_add_notifications.sql
```

---

# 4. Naming Convention

Migration filenames should follow the format:

```
YYYYMMDD_XXX_description.sql
```

Where:

- **YYYYMMDD** identifies the creation date.
- **XXX** is a sequential migration number.
- **description** briefly describes the purpose of the migration.

Examples:

```
20260726_001_initial_schema.sql
20260727_002_add_group_constraints.sql
20260730_003_create_indexes.sql
```

---

# 5. Types of Database Changes

Migration files may include:

- Creating tables
- Modifying tables
- Adding columns
- Removing columns
- Creating indexes
- Updating constraints
- Creating or modifying policies
- Creating views
- Creating functions
- Updating seed data

Each migration should focus on one logical change whenever possible.

---

# 6. Migration Workflow

The recommended workflow is:

1. Identify the required database change.
2. Create a new migration file.
3. Implement and review the SQL.
4. Test the migration in a development environment.
5. Verify application functionality.
6. Commit the migration to version control.
7. Update related documentation.

---

# 7. Documentation Requirements

Whenever a migration changes the database structure, update the following documentation as applicable:

- DatabaseDesign.md
- schema.sql
- rls_policies.sql
- tables.md
- relationships.md
- constraints.md
- indexes.md
- rls.md
- functions.md
- triggers.md
- CHANGELOG.md

Documentation should always reflect the current database implementation.

---

# 8. Validation

Before applying a migration, verify:

- SQL syntax is correct.
- Existing data is preserved where required.
- Constraints remain valid.
- Foreign key relationships remain intact.
- Row Level Security policies continue to function.
- Application features remain operational.

---

# 9. Rollback Considerations

Where practical, migrations should be designed so that changes can be reversed safely.

Rollback planning should consider:

- Data preservation
- Dependency relationships
- Constraint restoration
- Index restoration
- Security policy restoration

Some destructive changes may require database backups before execution.

---

# 10. Best Practices

Developers should:

- Keep migrations small and focused.
- Avoid combining unrelated changes.
- Test migrations before deployment.
- Never modify previously committed migration files.
- Create a new migration for every schema change.
- Keep documentation synchronized with implementation.

---

# 11. Summary

Database migrations provide a reliable and repeatable method for evolving the Coop Ledger database. Following these practices ensures that schema changes remain consistent, traceable, and maintainable throughout the project's lifecycle.