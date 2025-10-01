# ISSUE-003: Configure Environment Secrets

**Sprint:** Sprint 1 | **Phase:** 0 - Pre-Deployment | **Priority:** P0
**Time:** 30 minutes | **Points:** 2 | **Status:** BLOCKED - AWAITING MANUAL CONFIG
**Created:** 2025-09-30 20:22:00 EDT
**Started:** 2025-09-30 20:37:00 EDT
**Blocked:** Requires Developer to obtain API keys

## What You'll Do

Update `.env.local` file with actual API keys and credentials needed for BrAve Forms deployment.

## Why This Matters

Kubernetes secrets are created from `.env.local`. Placeholder values will cause backend/web to fail at runtime.

## Prerequisites

- Access to Clerk dashboard (https://dashboard.clerk.dev)
- OpenWeatherMap API key (https://openweathermap.org/api)

## Step-by-Step

### 1. Review Current .env.local

```bash
cat ".env.local"
```

### 2. Update Required Values

**Clerk Authentication (REQUIRED):**

```bash
CLERK_SECRET_KEY="sk_test_YOUR_ACTUAL_KEY"  # Get from Clerk dashboard
CLERK_PUBLISHABLE_KEY="pk_test_YOUR_ACTUAL_KEY"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_YOUR_ACTUAL_KEY"  # Same as above
```

**Weather API (REQUIRED for EPA compliance):**

```bash
OPENWEATHER_API_KEY="YOUR_ACTUAL_API_KEY"  # Free tier sufficient
```

**Database & Redis (Already Configured):**

```bash
DATABASE_USER="brave"  # OK as-is
DATABASE_PASSWORD="brave_secure_pass"  # OK for local dev
REDIS_PASSWORD=""  # Empty OK for local
```

**MinIO (Already Configured):**

```bash
MINIO_ACCESS_KEY="minioadmin"  # OK as-is
MINIO_SECRET_KEY="minioadmin"  # OK for local dev
```

### 3. Validate Configuration

Create checklist (do NOT commit with actual values):

- [ ] Clerk keys start with `sk_test_` and `pk_test_`
- [ ] OpenWeatherMap key is non-empty
- [ ] Database password is set
- [ ] All placeholder "YOUR_KEY_HERE" replaced

### 4. Test Environment File

```bash
# Verify file is valid (no syntax errors)
cat ".env.local" | grep "="
```

## Current Status

**Already Configured:** ✓

- Database credentials (brave/brave_secure_pass)
- Redis configuration (empty password for local)
- MinIO credentials (minioadmin/minioadmin)
- EPA compliance settings (0.25" threshold)

**Missing - Requires Developer Action:** ⚠

- CLERK_SECRET_KEY (currently: "sk_test_YOUR_KEY_HERE")
- CLERK_PUBLISHABLE_KEY (currently: "pk_test_YOUR_KEY_HERE")
- NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY (currently: "pk_test_YOUR_KEY_HERE")
- OPENWEATHER_API_KEY (currently: "YOUR_API_KEY_HERE")

**Detailed Setup Guide Created:**
See `evidence/ISSUE-003/deployment/API_KEYS_SETUP_GUIDE.md` for step-by-step instructions.

## Acceptance Criteria

- [x] `.env.local` exists in project root - ✓ VERIFIED
- [ ] All REQUIRED secrets have actual values (not placeholders) - ⚠ AWAITING CONFIG
- [ ] Clerk keys obtained from dashboard - ⚠ DEVELOPER ACTION REQUIRED
- [ ] OpenWeatherMap API key obtained - ⚠ DEVELOPER ACTION REQUIRED
- [x] Checklist created (values redacted for security) - ✓ COMPLETED

## Evidence Required

Save to `docs/sprints/sprint1/evidence/ISSUE-003/deployment/`:

- `secrets-checklist.md` - Completed checklist (VALUES REDACTED)
- Do NOT commit actual secret values

## Common Issues

- **Clerk organization mode:** Ensure Organizations feature enabled (personal accounts should be disabled)
- **OpenWeather free tier:** Limit 60 calls/minute (sufficient for testing)
- **Missing .env.local:** Copy from `.env.template`

## Security Note

**NEVER commit `.env.local` to git.** File is in `.gitignore`.

## Next Issue

After completion, proceed to ISSUE-004 (Create Kubernetes Secrets)

---

**Research:** Verified against actual `.env.local` structure from codebase
