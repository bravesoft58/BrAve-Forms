# BF-23: User Management — Create, Delete, Assign Roles

**Sprint:** Sprint 2 (added mid-sprint for UAT readiness)
**Story Points:** 3
**Priority:** HIGH
**Dependencies:** BF-01 (auth), BF-02 (profiles)
**Status:** IN PROGRESS
**Created:** 2026-03-10
**Last Updated:** 2026-03-10T18:00:00Z
**Backlog Ref:** UAT prerequisite — not in original sprint plan

---

## Summary

Admin needs to create user accounts, delete users, and assign roles (admin/user) so that UAT testers can be invited to the platform. Uses Supabase Admin Auth API via service role client.

---

## Acceptance Criteria

- [ ] AC-1: Users page shows table of all users (name, email, role, created date)
- [ ] AC-2: Admin can create a new user (email, name, role) — sends invite email
- [ ] AC-3: Admin can delete a user (with confirmation)
- [ ] AC-4: Admin can change a user's role (admin ↔ user)
- [ ] AC-5: Page is admin-only (non-admins redirected)
- [ ] AC-6: New user receives email with link to set password

---

## Tasks

- [ ] T-23.1: Build server actions (createUser, deleteUser, updateRole) using service role client
- [ ] T-23.2: Build Users page with table, create form, role toggle, delete button
- [ ] T-23.3: Test create → invite email → login flow

---

## Technical Notes

- Uses `supabase.auth.admin.createUser()` / `deleteUser()` / `updateUserById()` via service role client
- `inviteUserByEmail()` sends magic link for password setup
- Profile auto-created by `handle_new_user()` trigger on auth.users insert
- Service role client already exists: `src/lib/supabase/service.ts`

---

## Files to Modify

| File | Change |
|------|--------|
| `src/app/dashboard/users/page.tsx` | REWRITE — replace placeholder with user list |
| `src/app/dashboard/users/actions.ts` | CREATE — server actions for CRUD |
| `src/lib/queries/users.ts` | CREATE — query functions for user list |
