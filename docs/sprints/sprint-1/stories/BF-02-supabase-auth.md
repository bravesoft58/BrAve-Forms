# BF-02: Supabase Auth + Protected Routes

**Sprint:** Sprint 1 - Foundation + First Form
**Story Points:** 3
**Priority:** CRITICAL BLOCKER
**Dependencies:** None
**Status:** COMPLETE
**Created:** 2026-03-05
**Completed:** 2026-03-05T22:15:00Z
**Last Updated:** 2026-03-05T22:15:00Z
**Backlog Ref:** Andy Salvage Plan Section 8 (Auth Simplification)

---

## Summary

Implement Supabase Auth with email/password signup and login. Create login and signup pages, protect dashboard routes via middleware, and handle auth state throughout the app. The Supabase client wiring already exists in `src/lib/supabase/` -- this story builds the UI and route protection on top.

---

## CEO Directives

- Two roles: ADMIN (manages everything) and USER (assigned projects only)
- Inspector has NO account -- QR token access (future sprint)
- Keep it simple for Q&D pilot -- email/password is sufficient, no social login needed

---

## Acceptance Criteria

- [x] `/login` page with email/password form, link to signup
- [x] `/signup` page with email, password, full name fields, link to login
- [x] Successful login redirects to `/dashboard`
- [x] Successful signup creates auth user + profile record (via DB trigger from BF-01)
- [x] Middleware redirects unauthenticated users from `/dashboard/*` to `/login`
- [x] Middleware redirects authenticated users from `/login` and `/signup` to `/dashboard`
- [x] Logout button works and redirects to `/login`
- [x] Auth errors display user-friendly messages (wrong password, email taken, etc.)
- [x] Server components can access current user via Supabase server client

---

## Tasks

- [x] T-02.1: Create `/login` page with email/password form (1h)
- [x] T-02.2: Create `/signup` page with email, password, full_name (1h)
- [x] T-02.3: Update middleware to protect `/dashboard/*` routes and redirect logic (1h)
- [x] T-02.4: Create auth utility -- getCurrentUser() server helper (0.5h)
- [x] T-02.5: Add error handling and loading states to auth forms (0.5h)
- [x] T-02.6: Test login/signup/logout flow end-to-end (0.5h)

---

## Files to Modify

| File | Change |
|------|--------|
| `src/app/login/page.tsx` | CREATE -- Login form page (~80 lines) |
| `src/app/signup/page.tsx` | CREATE -- Signup form page (~90 lines) |
| `src/app/auth/callback/route.ts` | CREATE -- Auth callback handler for email confirmation (~20 lines) |
| `src/middleware.ts` | MODIFY -- Add auth redirect logic |
| `src/lib/supabase/middleware.ts` | MODIFY -- Enhance session handling with redirect logic |
| `src/lib/auth.ts` | CREATE -- getCurrentUser() helper (~20 lines) |

---

## Key Interfaces

```typescript
// src/lib/auth.ts
export async function getCurrentUser(): Promise<{
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'user';
} | null>

// Login form action
async function login(formData: FormData): Promise<{ error?: string }>

// Signup form action
async function signup(formData: FormData): Promise<{ error?: string }>
```

---

## Technical Approach

| Component | Verdict | Rationale |
|-----------|---------|-----------|
| Auth provider | Supabase Auth | Built-in, integrates with RLS natively |
| Form handling | Server Actions | Next.js 16 standard -- no client-side fetch needed |
| Session mgmt | @supabase/ssr | Already installed, handles cookie-based sessions |
| Route protection | Middleware | Already scaffolded in src/middleware.ts |

---

## Testing

Manual verification:
- Sign up with new email -- verify profile created in profiles table
- Log in with credentials -- verify redirect to /dashboard
- Access /dashboard while logged out -- verify redirect to /login
- Access /login while logged in -- verify redirect to /dashboard
- Log out -- verify redirect to /login, /dashboard blocked

---

## Comprehensive Validation (2026-03-05T22:15:00Z)

10 files, 414 lines — verified via /verify zero-trust protocol. Overall: 9.5/10.

| # | File | Score | Key Finding |
|---|------|:-----:|-------------|
| 1 | src/proxy.ts | 9.5 | Clean delegation |
| 2 | src/lib/supabase/proxy.ts | 9.5 | getUser() per-request (accepted for security) |
| 3 | src/lib/auth.ts | 9.0 | Profile query error silently falls back to defaults |
| 4 | src/app/login/page.tsx | 10.0 | Perfect server/client split |
| 5 | src/app/login/login-form.tsx | 9.5 | Clean form with error display |
| 6 | src/app/login/actions.ts | 9.5 | Proper server action |
| 7 | src/app/signup/page.tsx | 9.0 | Client-only page (inconsistent with login split) |
| 8 | src/app/signup/actions.ts | 9.5 | Dead success field removed during verify |
| 9 | src/app/auth/confirm/route.ts | 9.5 | Type cast on unvalidated input (Supabase validates) |
| 10 | src/app/auth/signout/route.ts | 9.0 | No CSRF protection (low severity) |

Build: passes clean (Next.js 16.1.6, TypeScript, all routes detected).
