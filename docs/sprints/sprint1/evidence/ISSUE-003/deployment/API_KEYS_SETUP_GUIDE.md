# API Keys Setup Guide - Detailed Instructions

**Created:** 2025-09-30 20:40:00 EDT
**Status:** MANUAL CONFIGURATION REQUIRED
**Estimated Time:** 15-20 minutes

## Overview

This guide provides step-by-step instructions for obtaining the required API keys for BrAve Forms Sprint 1 deployment.

---

## Part 1: Clerk Authentication Keys (REQUIRED)

**Why Required:** Clerk provides multi-tenant authentication with organization support. Without these keys, the application cannot authenticate users or enforce tenant isolation.

**Time Required:** 10 minutes
**Cost:** Free (up to 10,000 monthly active users)

### Step-by-Step: Clerk Setup

#### 1. Create Clerk Account

1. Navigate to: https://dashboard.clerk.dev/
2. Click "Sign Up" (or "Sign In" if you have an account)
3. Sign up with:
   - Email + Password, OR
   - GitHub OAuth, OR
   - Google OAuth
4. Verify your email address

#### 2. Create New Application

1. After login, click "Create Application" (or use existing application)
2. Application Settings:
   - **Name:** "BrAve Forms Dev" (or your preferred name)
   - **Application Type:** Production (can use for local dev)
   - Click "Create Application"

#### 3. Enable Organizations Feature (CRITICAL)

**IMPORTANT:** BrAve Forms requires Organizations for multi-tenancy.

1. In left sidebar, click "Organizations"
2. Toggle "Enable Organizations" to ON
3. Configuration options:
   - **Personal Accounts:** DISABLE (per CLAUDE.md requirements)
   - **Organization Creation:** Enable for admins
   - **Membership Roles:** Use default (admin, basic_member)
4. Click "Save Changes"

#### 4. Get API Keys

1. In left sidebar, click "API Keys"
2. You'll see two key types:

**Secret Key (Backend):**

- Label: "Secret Keys"
- Format: `sk_test_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`
- **CRITICAL:** Never expose this in frontend code
- Click "Copy" button next to the key

**Publishable Key (Frontend):**

- Label: "Publishable Keys"
- Format: `pk_test_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`
- Safe to expose in browser/mobile apps
- Click "Copy" button next to the key

#### 5. Configure .env.local

Open `.env.local` in your editor and replace:

```bash
# Before:
CLERK_SECRET_KEY="sk_test_YOUR_KEY_HERE"
CLERK_PUBLISHABLE_KEY="pk_test_YOUR_KEY_HERE"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_YOUR_KEY_HERE"

# After (example format):
CLERK_SECRET_KEY="sk_test_AbCdEf1234567890AbCdEf1234567890"
CLERK_PUBLISHABLE_KEY="pk_test_XyZ123AbC456DeF789GhI012JkL345Mn"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_XyZ123AbC456DeF789GhI012JkL345Mn"
```

**Note:** CLERK_PUBLISHABLE_KEY and NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY must be identical.

#### 6. Verify Clerk Configuration

In Clerk Dashboard:

1. Go to "JWT Templates"
2. Verify "default" template exists
3. Check that claims include:
   - `{{org.id}}` - Organization ID
   - `{{org.role}}` - User's role in org
   - `{{org.slug}}` - Organization slug

These claims are used for multi-tenant data isolation.

#### Troubleshooting Clerk

**Issue:** "Organizations not showing up"

- **Solution:** Ensure Organizations feature is enabled, personal accounts disabled

**Issue:** "Invalid API key" errors

- **Solution:** Verify you copied the correct key (Secret vs Publishable)
- **Solution:** Check for extra spaces when pasting

**Issue:** "JWT claims missing org data"

- **Solution:** Ensure user is in an organization, not personal account

---

## Part 2: OpenWeatherMap API Key (REQUIRED)

**Why Required:** OpenWeatherMap provides precipitation data for EPA CGP 0.25" rain threshold monitoring. Required for compliance features.

**Time Required:** 5 minutes
**Cost:** Free (60 calls/minute, 1,000,000 calls/month)

### Step-by-Step: OpenWeatherMap Setup

#### 1. Create Account

1. Navigate to: https://openweathermap.org/api
2. Click "Sign Up" in top navigation
3. Fill in registration form:
   - **Username:** Your choice
   - **Email:** Valid email address
   - **Password:** Secure password
4. Agree to terms and click "Create Account"
5. Check email for verification link
6. Click verification link to activate account

#### 2. Generate API Key

1. Log in to OpenWeatherMap
2. Click your username (top right)
3. Click "My API Keys" from dropdown
4. You'll see a default API key already created:
   - **Key Name:** "Default"
   - **Key:** 32-character alphanumeric string
5. Click "Copy" button to copy the key

**Alternative:** Create new API key

- Enter name in "Create key" field
- Click "Generate"
- Copy the new key

#### 3. Activate API Key

**IMPORTANT:** New API keys take 10 minutes to 2 hours to activate.

1. After creating key, wait 10-120 minutes
2. Test key activation:

```bash
# Replace YOUR_API_KEY with actual key
curl "https://api.openweathermap.org/data/2.5/weather?q=London&appid=YOUR_API_KEY"

# Expected response: JSON weather data
# Error response: {"cod":401,"message":"Invalid API key"}
```

#### 4. Configure .env.local

Open `.env.local` in your editor and replace:

```bash
# Before:
OPENWEATHER_API_KEY="YOUR_API_KEY_HERE"

# After (example format):
OPENWEATHER_API_KEY="a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
```

#### 5. Understand Free Tier Limits

**Free Tier Includes:**

- 60 calls/minute
- 1,000,000 calls/month
- Current weather data
- 5-day forecast
- Historical data (limited)

**BrAve Forms Usage:**

- Estimated: ~1,440 calls/day (one check per project per hour)
- For 100 projects: ~144,000 calls/month
- Well within free tier limits

**Rate Limiting:**

- App implements 6-hour cache (ISSUE-018)
- Reduces API calls by ~75%
- Prevents hitting rate limits

#### Troubleshooting OpenWeatherMap

**Issue:** "Invalid API key" error

- **Solution:** Wait 10-120 minutes for activation
- **Solution:** Verify key copied correctly (32 characters)

**Issue:** "Rate limit exceeded"

- **Solution:** Wait 1 minute, limit resets
- **Solution:** Verify Redis caching is enabled (reduces calls)

**Issue:** "401 Unauthorized"

- **Solution:** Check API key is active
- **Solution:** Verify no extra spaces in .env.local

---

## Part 3: Optional APIs (Not Required for Sprint 1)

### NOAA API (Already Configured)

**Status:** ✓ NO KEY REQUIRED

- NOAA API is public and free
- No registration needed
- Already configured as primary weather source
- OpenWeather is fallback only

### Push Notifications (FCM/APNS)

**Status:** Not needed for Sprint 1

- Can configure later when mobile deployment begins
- FCM: https://console.firebase.google.com/
- APNS: https://developer.apple.com/

### Monitoring (Sentry/Datadog)

**Status:** Not needed for Sprint 1

- Can configure later for production
- Sentry: https://sentry.io/
- Datadog: https://www.datadoghq.com/

---

## Part 4: Verify Configuration

After configuring all keys, run these checks:

### Check 1: No Placeholders Remain

```bash
cd "e:\BrAve Forms"
cat .env.local | grep "YOUR_KEY_HERE"
cat .env.local | grep "YOUR_API_KEY_HERE"
```

**Expected:** No output (all placeholders replaced)

### Check 2: Keys Format Validation

```bash
# Clerk Secret Key should start with sk_test_
cat .env.local | grep CLERK_SECRET_KEY

# Clerk Publishable Key should start with pk_test_
cat .env.local | grep CLERK_PUBLISHABLE_KEY

# OpenWeather key should be 32 characters
cat .env.local | grep OPENWEATHER_API_KEY
```

### Check 3: File Security

```bash
# Verify .env.local is in .gitignore
git check-ignore .env.local
```

**Expected:** `.env.local` (confirms it's ignored)

### Check 4: Test OpenWeather Key

```bash
# Replace with your actual key
curl "https://api.openweathermap.org/data/2.5/weather?q=London&appid=YOUR_ACTUAL_KEY"
```

**Expected:** JSON response with weather data
**Error:** {"cod":401} means key not activated yet (wait 10-120 min)

---

## Part 5: Security Best Practices

### Critical Security Rules

1. **NEVER commit .env.local to git**
   - Already in .gitignore
   - Verify: `git status` should NOT show .env.local

2. **NEVER share keys in plain text**
   - Don't send via email
   - Don't paste in Slack/Discord
   - Use secure password managers

3. **NEVER expose Secret Key in frontend**
   - CLERK_SECRET_KEY: Backend only
   - CLERK_PUBLISHABLE_KEY: Frontend OK
   - NEXT*PUBLIC*\* prefix: Frontend OK

4. **Rotate keys if exposed**
   - If accidentally committed: Rotate immediately
   - If shared insecurely: Generate new keys
   - Clerk: Delete old key, generate new
   - OpenWeather: Deactivate old key, create new

### What to Do If Keys Are Compromised

**If you accidentally commit .env.local:**

```bash
# 1. Remove from git history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env.local" \
  --prune-empty --tag-name-filter cat -- --all

# 2. Force push (WARNING: Rewrites history)
git push origin --force --all

# 3. Rotate ALL keys immediately
# - Generate new Clerk keys
# - Generate new OpenWeather key
```

**Then:**

1. Go to Clerk dashboard → Delete exposed keys
2. Go to OpenWeather → Deactivate exposed key
3. Generate new keys
4. Update .env.local with new keys

---

## Completion Checklist

Before marking ISSUE-003 complete:

- [ ] Clerk account created
- [ ] Organizations feature enabled
- [ ] Personal accounts disabled
- [ ] Clerk Secret Key configured in .env.local
- [ ] Clerk Publishable Key configured in .env.local
- [ ] NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY matches Publishable Key
- [ ] OpenWeatherMap account created
- [ ] OpenWeather API key generated
- [ ] OpenWeather API key activated (10-120 min wait)
- [ ] OpenWeather key configured in .env.local
- [ ] No placeholder values remain in .env.local
- [ ] .env.local verified in .gitignore
- [ ] Test curl to OpenWeather succeeds

---

## Next Steps

After completing this guide:

1. Update ISSUE-003 status to COMPLETED
2. Proceed to ISSUE-004: Create Kubernetes Secrets
3. Kubernetes will read .env.local to create secrets

---

## Support Resources

**Clerk Documentation:**

- Getting Started: https://clerk.com/docs/quickstarts/setup-clerk
- Organizations: https://clerk.com/docs/organizations/overview
- JWT Templates: https://clerk.com/docs/backend-requests/handling/manual-jwt

**OpenWeatherMap Documentation:**

- API Docs: https://openweathermap.org/api
- FAQ: https://openweathermap.org/faq
- Rate Limits: https://openweathermap.org/price

**BrAve Forms Specific:**

- CLAUDE.md: Project development rules
- RANCHER_DESKTOP_SETUP.md: Infrastructure setup

---

**Total Time Required:** 15-20 minutes
**Difficulty:** Beginner-friendly (step-by-step instructions)
**Cost:** $0 (both services have generous free tiers)
