# User Guide

**Project:** Coop Ledger  
**Version:** 1.0  
**Last Updated:** 2026-07-26

---

# 1. Introduction

Welcome to Coop Ledger.

Coop Ledger is a web-based cooperative savings management application that enables users to create cooperative groups, manage memberships, submit contributions, and track contribution history in a secure environment.

This guide explains how to use the application.

---

# 2. Getting Started

## Requirements

To use Coop Ledger, you need:

- A modern web browser
- An internet connection
- A registered account

---

## Creating an Account

1. Open the application.
2. Select **Sign Up**.
3. Enter the required information.
4. Verify your account if required.
5. Sign in using your credentials.

Authentication is managed by Supabase Authentication.

---

# 3. Signing In

1. Open the application.
2. Enter your email address.
3. Enter your password.
4. Select **Sign In**.

After successful authentication you will be redirected to the application dashboard.

---

# 4. Managing Your Profile

Users can:

- View their profile
- Update profile information
- Manage their application account

Each user can manage only their own profile.

---

# 5. Creating a Cooperative Group

To create a new cooperative group:

1. Navigate to the Groups section.
2. Select **Create Group**.
3. Enter the required group information.
4. Specify the contribution amount.
5. Save the group.

The creator becomes the administrator of the cooperative group.

---

# 6. Joining a Group

Users may join an existing cooperative group when invited or when membership is permitted.

Once approved, the user becomes a member of the cooperative.

Duplicate memberships are not permitted.

---

# 7. Making Contributions

To submit a contribution:

1. Open the appropriate cooperative group.
2. Select **Submit Contribution**.
3. Enter the payment information.
4. Provide the payment reference.
5. Submit the contribution.

The contribution is recorded with a pending verification status until reviewed.

---

# 8. Contribution Status

Contribution records may have one of the following statuses.

| Status               | Description                         |
| -------------------- | ----------------------------------- |
| Pending Verification | Awaiting review                     |
| Approved             | Verified by the group administrator |
| Rejected             | Verification unsuccessful           |

---

# 9. Security

Coop Ledger protects user information through:

- Secure authentication
- Database Row Level Security
- User-specific permissions
- Protected contribution records

Users can access only information they are authorized to view.

---

# 10. Troubleshooting

## Unable to Sign In

- Verify your email address.
- Verify your password.
- Ensure internet connectivity.

---

## Unable to Join a Group

Verify that:

- You have permission to join.
- You are not already a member.

---

## Contribution Not Visible

Ensure the contribution was successfully submitted and is associated with the correct cooperative group.

---

# 11. Support

If you experience issues that cannot be resolved through this guide, contact the project administrator or development team.

---

# 12. Summary

This guide provides the basic information required to use the Coop Ledger application, from account creation through contribution management.
