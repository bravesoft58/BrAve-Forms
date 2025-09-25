# BrAve Forms Development Environment Setup

## 🚨 Required External API Keys

Before starting development, you MUST obtain these API keys and configure them in your `.env.local` file:

### 1. Clerk Authentication (REQUIRED)
**Critical: The application will not start without these keys**

1. Go to [Clerk Dashboard](https://dashboard.clerk.dev/)
2. Create a new application or select existing BrAve Forms app
3. Navigate to "API Keys" in the sidebar
4. Copy the following keys to your `.env.local`:

```bash
# From Clerk Dashboard > API Keys
CLERK_SECRET_KEY="sk_test_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
CLERK_PUBLISHABLE_KEY="pk_test_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
```

**Note:** Use `sk_test_` and `pk_test_` keys for development. Production uses `sk_live_` and `pk_live_`.

### 2. Weather API (REQUIRED for EPA Compliance)
**Critical: Rain trigger functionality requires weather data**

#### OpenWeatherMap (Primary - Free tier available)
1. Go to [OpenWeatherMap API](https://openweathermap.org/api)
2. Sign up for free account
3. Get your free API key
4. Add to `.env.local`:

```bash
OPENWEATHER_API_KEY="your_openweathermap_api_key_here"
```

#### NOAA API (Backup - Government API)
1. Go to [NOAA Climate Data Online](https://www.ncdc.noaa.gov/cdo-web/webservices/v2)
2. Request API token (free but requires approval)
3. Add to `.env.local`:

```bash
NOAA_API_KEY="your_noaa_api_key_here"
```

**Note:** At least one weather API key is required. OpenWeatherMap is recommended for development.

### 3. Optional Services

#### Push Notifications (Optional)
```bash
# Firebase Cloud Messaging (Android/Web)
FCM_SERVER_KEY="your_fcm_server_key"

# Apple Push Notification Service (iOS)
APNS_KEY_ID="your_apns_key_id"
APNS_TEAM_ID="your_apple_team_id"
```

#### Monitoring (Optional)
```bash
# Sentry for error tracking
SENTRY_DSN="your_sentry_dsn"

# Datadog for monitoring
DATADOG_API_KEY="your_datadog_api_key"
```

## 🔧 Complete Environment Setup

### Step 1: Verify Prerequisites
```bash
# Check Node.js version (≥18.0.0 required)
node --version

# Check pnpm (≥8.0.0 required)
pnpm --version

# Install pnpm if missing
npm install -g pnpm

# Check kubectl (for database access)
kubectl version --client
```

### Step 2: Configure Environment
```bash
# Copy the example environment file
cp .env.local .env.local

# Edit .env.local with your API keys
# IMPORTANT: Replace all "YOUR_KEY_HERE" placeholders
```

### Step 3: Start Infrastructure Services
```bash
# Start Kubernetes port forwarding (in separate terminal)
./scripts/setup-port-forwarding.sh

# This will:
# - Forward PostgreSQL: localhost:5433 → cluster
# - Forward Redis: localhost:6380 → cluster
# - Keep running in foreground (don't close this terminal)
```

### Step 4: Install Dependencies
```bash
# Install all project dependencies
pnpm install

# Generate Prisma client
pnpm db:generate

# Run database migrations
pnpm db:migrate
```

### Step 5: Verify Setup
```bash
# Run comprehensive environment test
./scripts/test-environment.sh

# Test GraphQL connectivity
node ./scripts/test-graphql-connectivity.js

# Test port forwarding
./scripts/setup-port-forwarding.sh test
```

### Step 6: Start Development
```bash
# Start all services (backend + web + mobile)
pnpm dev

# Or start individual services:
pnpm dev:backend    # NestJS API on :3002
pnpm dev:web        # Next.js web on :3003
pnpm dev:mobile     # Capacitor mobile dev
```

## 🧪 Testing the Setup

### Environment Validation
The environment test script validates all critical components:

```bash
./scripts/test-environment.sh
```

**Expected output:**
```
✅ Environment File: .env.local found
✅ Clerk Secret Key: Configured correctly
✅ Clerk Publishable Key: Configured correctly
✅ Database URL: Port-forwarded configuration detected
✅ Redis URL: Port-forwarded configuration detected
✅ EPA Rain Threshold: Exact 0.25 inches configured
✅ PostgreSQL Connection: Database accessible
✅ Redis Connection: Redis accessible
✅ Weather API Key: OpenWeatherMap key configured
```

### GraphQL API Testing
Test the GraphQL endpoint connectivity:

```bash
node ./scripts/test-graphql-connectivity.js
```

**Expected output:**
```
✅ GraphQL endpoint is accessible
✅ Authentication required (as expected)
⚠️  Compliance Queries: 0/3 working (expected during development)
```

### Manual Testing Checklist

#### Database Connectivity
```bash
# Test PostgreSQL connection
psql "postgresql://brave:CHANGE_ME_SECURE_PASSWORD@localhost:5433/brave_forms" -c "SELECT 1;"

# Test Redis connection
redis-cli -h localhost -p 6380 ping
```

#### API Endpoints
```bash
# Test health endpoint
curl http://localhost:3002/health

# Test GraphQL introspection
curl -X POST http://localhost:3002/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ __schema { queryType { name } } }"}'
```

#### Weather API Testing
```bash
# Test OpenWeatherMap API (replace YOUR_KEY with actual key)
curl "https://api.openweathermap.org/data/2.5/weather?lat=40.7128&lon=-74.0060&appid=YOUR_KEY"
```

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Check what's using the port
lsof -i :5433
lsof -i :6380

# Kill existing port forwards
./scripts/setup-port-forwarding.sh stop

# Restart
./scripts/setup-port-forwarding.sh start
```

### Database Connection Issues
```bash
# Check Kubernetes pods
kubectl get pods -n brave-forms

# Check service endpoints
kubectl get svc -n brave-forms

# Restart port forwarding
kubectl port-forward -n brave-forms svc/postgres 5433:5432
```

### Clerk Authentication Issues
1. Verify API keys in Clerk dashboard
2. Ensure using test keys (`sk_test_`, `pk_test_`)
3. Check application URL in Clerk settings
4. Verify JWT signature secret

### Weather API Issues
1. Check API key validity
2. Verify API quota/limits
3. Test API directly with curl
4. Check firewall/proxy settings

### Missing Dependencies
```bash
# Clean install
pnpm clean
pnpm install

# Regenerate Prisma
pnpm db:generate

# Clear pnpm cache
pnpm store prune
```

## 📁 Development File Structure

```
brave-forms/
├── apps/
│   ├── backend/           # NestJS GraphQL API
│   ├── web/               # Next.js web application
│   └── mobile/            # Capacitor mobile app
├── packages/
│   ├── database/          # Prisma schema & migrations
│   ├── types/             # Shared TypeScript types
│   └── compliance/        # EPA/OSHA rules engine
├── scripts/
│   ├── test-environment.sh           # Environment validation
│   ├── test-graphql-connectivity.js  # GraphQL testing
│   └── setup-port-forwarding.sh     # K8s port forwarding
└── tests/
    └── compliance/        # EPA compliance tests
```

## 🔍 Next Steps After Setup

1. **Review Compliance Tests**
   ```bash
   # Run EPA compliance test suite
   pnpm test:compliance
   ```

2. **Test Offline Functionality**
   ```bash
   # Run offline capability tests
   pnpm test:offline
   ```

3. **Start Feature Development**
   - Forms creation and submission
   - EPA rain trigger monitoring
   - Inspector portal access
   - Photo capture with GPS

4. **Mobile Development**
   ```bash
   # Build and test mobile app
   pnpm mobile:sync
   pnpm mobile:ios     # iOS development
   pnpm mobile:android # Android development
   ```

## ⚠️ Critical Compliance Notes

### EPA Rain Threshold
- **EXACTLY 0.25 inches** triggers SWPPP inspection
- **24-hour deadline** during working hours (7 AM - 5 PM)
- **No approximation** - must be precise to avoid fines

### Data Requirements
- **GPS coordinates** for all inspections
- **Photo evidence** with EXIF data
- **Audit trail** for regulatory compliance
- **30-day offline** operation capability

### Testing Requirements
- All compliance features must have **95% test coverage**
- EPA regulations must be **exactly implemented**
- Field conditions must be **thoroughly tested**

---

## 📞 Support

If you encounter issues during setup:

1. Check this README first
2. Run the diagnostic scripts
3. Review the error logs
4. Check Kubernetes cluster status
5. Verify all API keys are valid

Remember: This platform prevents $25,000-$50,000 daily EPA fines. Every configuration detail matters for regulatory compliance.