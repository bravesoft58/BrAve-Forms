# ISSUE-003 Environment Secrets Configuration - Checklist

**Timestamp:** 2025-09-30 20:37:00 EDT
**Status:** REQUIRES MANUAL ACTION
**Evidence Type:** Configuration checklist (values redacted for security)

## Current Configuration Status

### ✓ Already Configured (Ready to Use)

**Database:**

- [x] DATABASE_URL configured for Kubernetes PostgreSQL
- [x] Using port 5434 (mapped from K8s)
- [x] Credentials: brave/brave_secure_pass (secure for local dev)

**Redis:**

- [x] REDIS_URL configured for Kubernetes Redis
- [x] Using port 6381 (mapped from K8s)
- [x] Password empty (OK for local dev)

**MinIO (S3-compatible storage):**

- [x] AWS_ACCESS_KEY_ID: minioadmin
- [x] AWS_SECRET_ACCESS_KEY: minioadmin
- [x] S3_ENDPOINT: http://localhost:9000
- [x] Bucket: brave-forms-photos

**EPA Compliance Settings:**

- [x] EPA_RAIN_THRESHOLD_INCHES: 0.25 (EXACT per EPA CGP)
- [x] EPA_INSPECTION_HOURS: 24
- [x] EPA_WORKING_HOURS_START: 7
- [x] EPA_WORKING_HOURS_END: 17

**Feature Flags:**

- [x] ENABLE_OFFLINE_MODE: true
- [x] ENABLE_WEATHER_MONITORING: true
- [x] MAX_OFFLINE_DAYS: 30

### ⚠ REQUIRES MANUAL CONFIGURATION (Developer Action Required)

**Clerk Authentication (CRITICAL - REQUIRED):**

- [ ] CLERK_SECRET_KEY: Currently "sk_test_YOUR_KEY_HERE"
  - **Action:** Get from https://dashboard.clerk.dev/
  - **Format:** sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  - **Requirement:** Organizations feature must be enabled
- [ ] CLERK_PUBLISHABLE_KEY: Currently "pk_test_YOUR_KEY_HERE"
  - **Action:** Get from https://dashboard.clerk.dev/
  - **Format:** pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
- [ ] NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: Same as CLERK_PUBLISHABLE_KEY

**Weather API (REQUIRED for EPA compliance):**

- [ ] OPENWEATHER_API_KEY: Currently "YOUR_API_KEY_HERE"
  - **Action:** Get from https://openweathermap.org/api
  - **Free Tier:** 60 calls/minute (sufficient for testing)
  - **Format:** 32-character alphanumeric string
- [x] NOAA_API_KEY: Empty (no key required, NOAA API is public)

### ⚡ OPTIONAL (Can Configure Later)

**Push Notifications:**

- [ ] FCM_SERVER_KEY: Empty (not needed for Sprint 1)
- [ ] APNS_KEY_ID: Empty (not needed for Sprint 1)
- [ ] APNS_TEAM_ID: Empty (not needed for Sprint 1)

**Monitoring:**

- [ ] SENTRY_DSN: Empty (not needed for Sprint 1)
- [ ] DATADOG_API_KEY: Empty (not needed for Sprint 1)

## Validation Checklist

**Before proceeding to ISSUE-004:**

1. **Clerk Keys Validation:**
   - [ ] CLERK*SECRET_KEY starts with "sk_test*"
   - [ ] CLERK*PUBLISHABLE_KEY starts with "pk_test*"
   - [ ] NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY matches CLERK_PUBLISHABLE_KEY
   - [ ] Keys obtained from Clerk dashboard
   - [ ] Organizations feature enabled in Clerk

2. **Weather API Validation:**
   - [ ] OPENWEATHER_API_KEY is non-empty (32 characters)
   - [ ] Key obtained from OpenWeatherMap
   - [ ] Free tier account created

3. **File Security:**
   - [x] .env.local is in .gitignore
   - [x] No actual secrets in git history
   - [x] File permissions restricted to developer only

4. **Syntax Validation:**
   - [x] All lines follow KEY="value" format
   - [x] No syntax errors in file
   - [x] All required keys present

## Configuration Steps for Developer

### Step 1: Get Clerk Keys

1. Go to https://dashboard.clerk.dev/
2. Create a new application or use existing one
3. Navigate to "API Keys" section
4. Copy "Secret Key" (starts with sk*test*)
5. Copy "Publishable Key" (starts with pk*test*)
6. Verify Organizations feature is enabled (required for multi-tenancy)

### Step 2: Get OpenWeatherMap API Key

1. Go to https://openweathermap.org/api
2. Sign up for free account
3. Navigate to API Keys section
4. Generate new API key (32-character string)
5. Note: Free tier allows 60 calls/minute (sufficient)

### Step 3: Update .env.local

```bash
# Open in editor
code .env.local

# Replace placeholder values:
CLERK_SECRET_KEY="sk_test_YOUR_ACTUAL_KEY_FROM_CLERK"
CLERK_PUBLISHABLE_KEY="pk_test_YOUR_ACTUAL_KEY_FROM_CLERK"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_YOUR_ACTUAL_KEY_FROM_CLERK"
OPENWEATHER_API_KEY="YOUR_ACTUAL_32_CHAR_KEY_FROM_OPENWEATHER"
```

### Step 4: Verify Configuration

```bash
# Check file has no syntax errors
cat .env.local | grep "="

# Verify no placeholders remain
cat .env.local | grep "YOUR_KEY_HERE"
# Should return NOTHING if all keys configured

cat .env.local | grep "YOUR_API_KEY_HERE"
# Should return NOTHING if all keys configured
```

## Security Notes

**CRITICAL SECURITY REQUIREMENTS:**

1. **NEVER commit .env.local to git** (already in .gitignore)
2. **Values in this checklist are REDACTED** for security
3. **Actual keys contain sensitive credentials**
4. **Only share keys through secure channels** (never in chat/email)

## Completion Criteria

**ISSUE-003 can be marked complete when:**

- [ ] All REQUIRED keys configured (Clerk + OpenWeather)
- [ ] Validation checklist above passes
- [ ] Developer confirms keys are valid
- [ ] No "YOUR_KEY_HERE" or "YOUR_API_KEY_HERE" remains in .env.local

## Next Steps After Completion

Once all required keys are configured:

1. Proceed to ISSUE-004: Create Kubernetes Secrets
2. Kubernetes will read from .env.local to create secrets
3. Backend/Web pods will use secrets at runtime

---

**Evidence Type:** Configuration checklist (security-compliant)
**Status:** Awaiting Developer to configure Clerk and OpenWeather API keys
