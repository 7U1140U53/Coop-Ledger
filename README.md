# Coop Ledger

> **A Web-Based Cooperative Savings and Contribution Management System**

---

## Overview

Coop Ledger is a web-based cooperative savings and contribution management system designed to digitize the administration of cooperative societies and rotating savings groups.

The application enables members to participate in contribution circles while providing treasurers with tools to verify deposits, manage contribution rounds, and maintain transparent financial records. By replacing manual bookkeeping with a centralized digital platform, Coop Ledger improves accountability, reduces administrative effort, and provides a reliable audit trail of cooperative activities.

---

## Table of Contents

- Overview
- Problem Statement
- Solution
- Key Features
- Screenshots
- Technology Stack
- System Architecture
- Installation
- Configuration
- Project Structure
- User Roles
- Security
- Documentation
- Future Enhancements
- License

---

## Problem Statement

Many cooperative societies and rotating savings groups continue to rely on notebooks, spreadsheets, and messaging applications to manage member contributions.

These manual processes often lead to:

- Lost or inconsistent records
- Difficult contribution verification
- Limited financial transparency
- Administrative overhead
- Poor historical tracking
- Increased potential for human error

As cooperative membership grows, these challenges become increasingly difficult to manage efficiently.

---

## Solution

Coop Ledger provides a centralized web application that digitizes the cooperative contribution lifecycle.

The system enables members to submit contribution information while allowing treasurers to verify deposits, manage contribution rounds, maintain contribution history, and administer cooperative circles through a secure role-based platform.

---

## Key Features

### User Authentication

- Secure user registration and login using Supabase Authentication.
- Role-based access for members and treasurers.
- Persistent user sessions.

### User Profile

- Update display name.
- Synchronize profile information across cooperative circles.

### Cooperative Circle Management

- Create and manage multiple cooperative circles.
- Join circles using secure invitation links.
- Archive completed circles.
- Switch seamlessly between multiple circles.

### Contribution Management

- Submit contribution details for verification.
- View contribution history and verification status.
- Resubmit rejected contributions.
- Track contribution rounds.

### Treasurer Administration

- Verify member contributions.
- Approve or reject submitted deposits.
- Advance contribution rounds.
- Force close active rounds when necessary.

### Transparency & Accountability

- Complete contribution history.
- Audit trail of important activities.
- Real-time contribution status updates.
- Clear visibility into member participation.

### Security

- Row Level Security (RLS) policies.
- Secure authentication using Supabase Auth.
- Role-based authorization.
- Protected database access.


---

## Screenshots

Screenshots demonstrating the application's interface and workflows will be added in a future update.

Planned screenshots include:

- Login page
- Dashboard
- Circle management
- Contribution submission
- Treasurer dashboard
- Contribution history
- Profile settings


---

## Technology Stack

| Layer | Technology |
|--------|------------|
| Frontend | HTML5 |
| Styling | Tailwind CSS |
| Programming Language | JavaScript (ES6) |
| Backend | Supabase |
| Database | PostgreSQL |
| Authentication | Supabase Auth |
| Security | Row Level Security (RLS) |


---

## System Architecture

Coop Ledger follows a client-server architecture built around a modern web application stack.

```
+---------------------------+
|        Web Browser        |
|  HTML • CSS • JavaScript  |
+-------------+-------------+
              |
              | HTTPS
              |
+-------------v-------------+
|         Supabase          |
| Authentication • Database |
| Row Level Security (RLS)  |
+-------------+-------------+
              |
              |
+-------------v-------------+
|       PostgreSQL          |
| Cooperative Ledger Data   |
+---------------------------+
```

The application separates presentation, business logic, authentication, and data storage to provide a secure and maintainable architecture.


---

## Database Design

The application stores data in PostgreSQL using Supabase.

Core entities include:

| Entity | Purpose |
|---------|---------|
| Users | Stores authenticated user information |
| Circles | Cooperative savings groups |
| Circle Members | Membership records and user roles |
| Contributions | Member contribution submissions |
| Rounds | Contribution cycle management |
| Audit Logs | Records important system activities |

Row Level Security (RLS) policies enforce data isolation, ensuring users can only access information they are authorized to view.


---

## Installation

Clone the repository:

```bash
git clone https://github.com/YOUR_USERNAME/Coop-Ledger.git
```

Navigate into the project directory:

```bash
cd Coop-Ledger
```

Configure your Supabase credentials in your local configuration file.

Open `index.html` in your browser or serve the project using a local development server.


---

## Configuration

Create a local configuration file based on the provided example.

```javascript
window.SUPABASE_CONFIG = {
    URL: "YOUR_SUPABASE_URL",
    ANON_KEY: "YOUR_SUPABASE_ANON_KEY"
};
```

Never commit production credentials to the repository.

Use `config.example.js` as the template for local configuration.


## Project Structure

```
Coop-Ledger/
│
├── assets/
│   ├── diagrams/
│   ├── images/
│   ├── logo/
│   ├── screenshots/
│   └── favicon.png
│
├── docs/
│   ├── Architecture.md
│   ├── ArchitectureDiagram.md
│   ├── CHANGELOG.md
│   ├── Database.md
│   ├── DeveloperGuide.md
│   ├── FutureRoadmap.md
│   ├── PRD.md
│   ├── ProjectOverview.md
│   ├── Screenshots.md
│   ├── TestingChecklist.md
│   └── UserGuide.md
│
├── sql/
│   ├── schema.sql
│   ├── rls_policies.sql
│   ├── sample_data.sql
│   └── seed.sql
│
├── .gitignore
├── app.js
├── config.js
├── index.html
├── LICENSE
├── README.md
└── style.css
```


---

# User Roles

Coop Ledger implements role-based access control to ensure users can only perform actions appropriate to their responsibilities.

## Member

Members can:

- Register and authenticate securely.
- Join cooperative circles using invitation links.
- Submit contribution details for verification.
- View contribution history and contribution status.
- Update their display name.
- Participate in multiple cooperative circles.

## Treasurer

Treasurers inherit all member permissions and can additionally:

- Create and manage cooperative circles.
- Invite members using secure invitation links.
- Verify member contributions.
- Approve or reject contribution submissions.
- Advance contribution rounds.
- Force close active contribution rounds.
- Archive completed cooperative circles.
- Monitor cooperative activities through audit records.

---

# Application Lifecycle

The following diagram illustrates the complete lifecycle of a cooperative circle within Coop Ledger.

```text
Treasurer Login
       │
       ▼
Create Cooperative Circle
       │
       ▼
Invite Members
       │
       ▼
Members Join Circle
       │
       ▼
Members Submit Contributions
       │
       ▼
Treasurer Reviews Contributions
       │
 ┌─────┴─────┐
 ▼           ▼
Approved   Rejected
 │             │
 ▼             ▼
Recorded   Member Resubmits
       │
       ▼
Advance Contribution Round
       │
       ▼
Repeat Until Final Round
       │
       ▼
Archive Cooperative Circle
```

This lifecycle represents the primary business process supported by Coop Ledger, from the creation of a cooperative circle through its completion and archival.

---

# Core Workflows

The following workflows describe the major operations performed within the application.

## 1. Create a Cooperative Circle

```text
Treasurer Login
        │
        ▼
Create Circle
        │
        ▼
Configure Circle Details
        │
        ▼
Circle Created
        │
        ▼
Invitation Link Generated
```

---

## 2. Member Onboarding

```text
Receive Invitation Link
          │
          ▼
Join Cooperative Circle
          │
          ▼
Become Active Member
```

---

## 3. Contribution Submission

```text
Submit Contribution
        │
        ▼
Await Treasurer Review
        │
        ▼
Approved ─────────► Contribution Recorded

        OR

Rejected ─────────► Update & Resubmit
```

---

## 4. Contribution Verification

```text
Contribution Submitted
          │
          ▼
Treasurer Reviews
          │
     ┌────┴────┐
     ▼         ▼
Approve     Reject
     │         │
     ▼         ▼
Recorded   Await Resubmission
```

---

## 5. Contribution Round Management

```text
Current Round
      │
      ▼
Members Contribute
      │
      ▼
Treasurer Verifies
      │
      ▼
Advance Round
      │
      ▼
Next Contribution Cycle
```

---

## 6. Circle Completion

```text
Final Round Completed
          │
          ▼
Archive Circle
          │
          ▼
Read-Only Historical Record
```

---

# Security

Coop Ledger incorporates multiple security measures to protect user data and enforce appropriate access control.

## Authentication

- Secure authentication using Supabase Auth.
- Persistent authenticated user sessions.
- Protected application access.

## Authorization

- Role-based access control.
- Separate permissions for Members and Treasurers.
- Restricted administrative operations.

## Database Security

- PostgreSQL database hosted on Supabase.
- Row Level Security (RLS) policies.
- Secure server-side data access enforcement.
- Users can only access records they are authorized to view.

---

# Documentation

Comprehensive documentation is available within the `docs/` directory.

| Document | Purpose |
|----------|---------|
| ProjectOverview.md | High-level overview of the project |
| PRD.md | Product Requirements Document |
| Architecture.md | System architecture |
| ArchitectureDiagram.md | Architecture diagrams |
| Database.md | Database design |
| UserGuide.md | End-user guide |
| DeveloperGuide.md | Developer reference |
| TestingChecklist.md | Functional testing checklist |
| Screenshots.md | Screenshot documentation |
| FutureRoadmap.md | Planned future enhancements |
| CHANGELOG.md | Version history |

---

# Future Enhancements

Potential improvements planned for future releases include:

- Real-time synchronization using Supabase Realtime.
- Email notifications.
- Push notifications.
- Receipt image uploads.
- Dashboard analytics.
- PDF exports.
- Excel exports.
- Progressive Web App (PWA) support.
- Mobile application.
- Multi-language support.
- Enhanced profile management.
- Two-factor authentication (2FA).
- Administrative reporting dashboard.

---

# License

This project is licensed under the MIT License.

See the `LICENSE` file for additional information.

---

# Author

**Olakunle Fayemiwo**

Software Developer | Full-Stack Web Developer

Coop Ledger was developed as a capstone project to demonstrate the design and implementation of a secure, web-based cooperative savings and contribution management system. The project showcases modern web development practices, role-based access control, secure database design, and user-centered workflow management.