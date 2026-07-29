# Product Requirements Document (PRD)

## Coop Ledger

**Version:** 1.0.0

**Project Type:** Web-Based Cooperative Savings and Contribution Management System

**Status:** Stable Release

**Author:** Olakunle Fayemiwo

**Document Version:** 1.0

**Last Updated:** July 2026

---

# 1. Document Control

| Item     | Value                         |
| -------- | ----------------------------- |
| Project  | Coop Ledger                   |
| Document | Product Requirements Document |
| Version  | 1.0                           |
| Status   | Stable                        |
| Owner    | Olakunle Fayemiwo             |

## Revision History

| Version | Date      | Author            | Description     |
| ------- | --------- | ----------------- | --------------- |
| 1.0     | July 2026 | Olakunle Fayemiwo | Initial release |

---

# 2. Executive Summary

Coop Ledger is a web-based cooperative savings and contribution management system developed to digitize the administration of cooperative societies and rotating savings groups.

The platform enables treasurers to create and manage cooperative circles while allowing members to securely participate in contribution cycles through a centralized digital platform. By replacing manual record keeping with structured workflows, Coop Ledger improves transparency, accountability, and operational efficiency.

This document defines the functional and non-functional requirements for Version 1.0.0 of the application.

---

# 3. Problem Statement

Many cooperative societies continue to rely on notebooks, spreadsheets, messaging applications, and manual bookkeeping to manage member contributions.

These approaches present several challenges, including:

- Inconsistent financial records.
- Manual verification of contributions.
- Limited transparency.
- Difficulty tracking historical contributions.
- Administrative overhead.
- Increased risk of human error.

As cooperative membership grows, these challenges become increasingly difficult to manage effectively.

---

# 4. Product Vision

To provide cooperative societies with a secure, transparent, and easy-to-use web application for managing cooperative savings, contribution verification, and contribution rounds through a centralized digital platform.

---

# 5. Project Objectives

The objectives of Coop Ledger are to:

- Digitize cooperative savings management.
- Improve contribution transparency.
- Simplify contribution verification.
- Reduce manual bookkeeping.
- Maintain an auditable history of contributions.
- Support multiple cooperative circles.
- Provide secure role-based access control.
- Improve operational efficiency for cooperative administrators.

---

# 6. Stakeholders

The following stakeholders are involved in the development and use of Coop Ledger.

| Stakeholder          | Responsibility                                                                        |
| -------------------- | ------------------------------------------------------------------------------------- |
| Cooperative Members  | Participate in contribution circles and submit contributions.                         |
| Treasurers           | Manage cooperative circles, verify contributions, and administer contribution rounds. |
| System Administrator | Maintain and deploy the application.                                                  |
| Developers           | Develop, maintain, and enhance the platform.                                          |

---

# 7. Target Users

Coop Ledger is designed for organizations and groups that manage recurring savings and contribution schemes, including:

- Cooperative societies
- Rotating savings groups (Ajo, Esusu, Adashe, etc.)
- Community savings clubs
- Workplace savings associations
- Small investment groups

---

# 8. Project Scope

## In Scope

Version 1.0.0 includes:

- User authentication
- Cooperative circle creation
- Invitation link generation
- Member onboarding
- Multi-circle support
- Contribution submission
- Contribution verification
- Contribution approval and rejection
- Contribution resubmission
- Contribution history
- Contribution round management
- Force Close & Advance
- Circle archiving
- Audit logging
- Profile management
- Role-based access control

## Out of Scope

The following features are intentionally excluded from Version 1.0.0:

- Online payment processing
- Mobile applications
- Email notifications
- SMS notifications
- Receipt image uploads
- Financial reporting dashboards
- PDF exports
- Excel exports
- Multi-language support
- Two-factor authentication

---

# 9. Functional Requirements

## Authentication

| ID     | Requirement                                                                                   |
| ------ | --------------------------------------------------------------------------------------------- |
| FR-001 | The system shall allow users to register using a valid email address and password.            |
| FR-002 | The system shall authenticate registered users before granting access to protected resources. |
| FR-003 | The system shall maintain authenticated user sessions until logout or session expiration.     |

---

## Cooperative Circle Management

| ID     | Requirement                                                                              |
| ------ | ---------------------------------------------------------------------------------------- |
| FR-004 | The system shall allow Treasurers to create cooperative circles.                         |
| FR-005 | The system shall generate invitation links for cooperative circles.                      |
| FR-006 | The system shall allow users to join cooperative circles through valid invitation links. |
| FR-007 | The system shall support membership in multiple cooperative circles.                     |
| FR-008 | The system shall allow Treasurers to archive completed cooperative circles.              |

---

## Contribution Management

| ID     | Requirement                                                                     |
| ------ | ------------------------------------------------------------------------------- |
| FR-009 | The system shall allow members to submit contribution details for verification. |
| FR-010 | The system shall maintain contribution records for every submission.            |
| FR-011 | The system shall allow members to view their contribution history.              |
| FR-012 | The system shall display the verification status of each contribution.          |
| FR-013 | The system shall allow rejected contributions to be updated and resubmitted.    |

---

## Treasurer Operations

| ID     | Requirement                                                                                 |
| ------ | ------------------------------------------------------------------------------------------- |
| FR-014 | The system shall allow Treasurers to approve submitted contributions.                       |
| FR-015 | The system shall allow Treasurers to reject submitted contributions.                        |
| FR-016 | The system shall record the outcome of every verification decision.                         |
| FR-017 | The system shall allow Treasurers to advance contribution rounds.                           |
| FR-018 | The system shall allow Treasurers to force close active contribution rounds when necessary. |

---

## User Profile

| ID     | Requirement                                                                                             |
| ------ | ------------------------------------------------------------------------------------------------------- |
| FR-019 | The system shall allow users to update their display name.                                              |
| FR-020 | The updated display name shall be reflected throughout the application wherever the user is identified. |

---

## Audit and Activity Tracking

| ID     | Requirement                                                                               |
| ------ | ----------------------------------------------------------------------------------------- |
| FR-021 | The system shall maintain an audit log of significant cooperative activities.             |
| FR-022 | The system shall record contribution approvals, rejections, and round management actions. |

---

# 10. Non-Functional Requirements

The following non-functional requirements define the quality attributes of Coop Ledger.

| ID      | Requirement                                                                                                |
| ------- | ---------------------------------------------------------------------------------------------------------- |
| NFR-001 | The system shall provide a responsive user interface suitable for desktop and modern web browsers.         |
| NFR-002 | The system shall enforce secure authentication using Supabase Auth.                                        |
| NFR-003 | The system shall protect sensitive data using Row Level Security (RLS).                                    |
| NFR-004 | The system shall maintain data integrity for all contribution records.                                     |
| NFR-005 | The system shall provide consistent navigation across all application screens.                             |
| NFR-006 | The system shall provide appropriate feedback for successful and failed user actions.                      |
| NFR-007 | The system shall be maintainable through modular JavaScript code and organized project documentation.      |
| NFR-008 | The system shall support future feature enhancements without requiring significant architectural redesign. |

---

# 11. Business Rules

The following business rules govern the operation of Coop Ledger.

| ID     | Business Rule                                                              |
| ------ | -------------------------------------------------------------------------- |
| BR-001 | Only authenticated users may access the application.                       |
| BR-002 | Only Treasurers may create cooperative circles.                            |
| BR-003 | Only Treasurers may verify member contributions.                           |
| BR-004 | Members may only submit contributions to circles they belong to.           |
| BR-005 | Rejected contributions may be edited and resubmitted.                      |
| BR-006 | Contribution history shall remain available after verification.            |
| BR-007 | Archived cooperative circles become read-only.                             |
| BR-008 | All significant administrative actions shall be recorded in the audit log. |

---

# 12. User Stories

### Member

- As a Member, I want to join a cooperative circle using an invitation link so that I can participate in the savings scheme.
- As a Member, I want to submit contribution details so that my payment can be verified.
- As a Member, I want to view my contribution history so that I can track my participation.
- As a Member, I want to update my display name so that other members see my preferred name.

### Treasurer

- As a Treasurer, I want to create cooperative circles so that I can organize members.
- As a Treasurer, I want to verify member contributions so that contribution records remain accurate.
- As a Treasurer, I want to reject incorrect submissions so that members can correct and resubmit them.
- As a Treasurer, I want to advance contribution rounds so that the cooperative progresses through its contribution cycle.
- As a Treasurer, I want to archive completed circles so that historical records remain available without affecting active operations.

---

# 13. Functional Workflows

The following workflows describe the primary operational processes supported by Coop Ledger.

## Workflow 1: Cooperative Circle Creation

1. Treasurer authenticates into the system.
2. Treasurer creates a new cooperative circle.
3. The system stores the circle information.
4. The system generates an invitation link.
5. Treasurer shares the invitation link with prospective members.

---

## Workflow 2: Member Onboarding

1. Member receives an invitation link.
2. Member authenticates into the application.
3. Member joins the cooperative circle.
4. The system registers the member within the selected circle.

---

## Workflow 3: Contribution Submission

1. Member submits contribution details.
2. The system records the submission as pending.
3. Treasurer reviews the submission.
4. Treasurer approves or rejects the contribution.
5. If rejected, the member updates and resubmits the contribution.

---

## Workflow 4: Contribution Round Management

1. Treasurer reviews all submitted contributions.
2. Treasurer completes contribution verification.
3. Treasurer advances the contribution round.
4. Members begin the next contribution cycle.

---

## Workflow 5: Circle Completion

1. Final contribution round is completed.
2. Treasurer archives the cooperative circle.
3. The system preserves all historical records.
4. Archived circles become read-only.

---

# 14. System Requirements

## Client Requirements

- Modern web browser
- JavaScript enabled
- Internet connection

## Server Requirements

- Supabase Backend
- PostgreSQL Database
- Supabase Authentication
- Row Level Security (RLS)

---

# 15. Acceptance Criteria

Version 1.0.0 shall be considered complete when:

- Users can register and authenticate successfully.
- Treasurers can create cooperative circles.
- Members can join circles using invitation links.
- Members can submit contributions.
- Treasurers can approve and reject contributions.
- Members can resubmit rejected contributions.
- Contribution history is maintained.
- Contribution rounds can be advanced.
- Completed circles can be archived.
- Audit records are maintained.
- User profile updates function correctly.

---

# 16. Risks and Assumptions

## Assumptions

- Users have reliable internet connectivity.
- Users possess valid authentication credentials.
- Treasurers are responsible for contribution verification.
- Cooperative members provide accurate contribution information.

## Risks

- Internet connectivity interruptions.
- Human error during contribution verification.
- User mistakes during contribution submission.
- Unauthorized access attempts mitigated through authentication and Row Level Security.

---

# 17. Future Scope

Potential future enhancements include:

- Real-time synchronization.
- Push notifications.
- Email notifications.
- Receipt image uploads.
- Dashboard analytics.
- PDF report generation.
- Excel export.
- Mobile application.
- Progressive Web App (PWA).
- Multi-language support.
- Enhanced profile management.
- Two-factor authentication.
- Administrative reporting dashboard.

---

# 18. Version History

| Version | Date      | Description                                                  |
| ------- | --------- | ------------------------------------------------------------ |
| 1.0     | July 2026 | Initial stable release of the Product Requirements Document. |

---

# Conclusion

The Product Requirements Document defines the functional scope, operational workflows, quality requirements, and business rules for Coop Ledger Version 1.0.0.

The requirements documented within this specification provide a complete reference for the implementation, maintenance, testing, and future enhancement of the application while ensuring that the system continues to support secure, transparent, and efficient cooperative savings management.
