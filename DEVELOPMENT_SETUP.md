# BrAve Forms Development Setup Guide
**Last Updated**: September 6, 2025  
**Status**: FULLY OPERATIONAL ✅  
**Authentication**: CLERK REMOVED (Development Mode)  
**Current Environment**: Working and Tested  

## Prerequisites

### Required Software
- **Node.js**: v18.0.0 or higher
- **pnpm**: v8.0.0 or higher
- **PostgreSQL**: v15 with TimescaleDB extension
- **Redis**: v7.0 or higher (for BullMQ)
- **Git**: Latest version

### Recommended Tools
- **VS Code** with extensions:
  - ESLint
  - Prettier
  - Prisma
  - GraphQL
  - Thunder Client (API testing)
- **TablePlus** or **pgAdmin** for database management
- **Redis Insight** for Redis monitoring

## Initial Setup

### 1. Clone the Repository
```bash
git clone https://github.com/brave-forms/brave-forms.git
cd brave-forms
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Environment Configuration

Create `.env.local` file in the root directory:

```env
# Database (Docker Containerized)
DATABASE_URL="postgresql://brave_user:brave_pass@localhost:5434/brave_forms"

# Redis (Docker Containerized)
REDIS_URL="redis://localhost:6381"

# Authentication: CLERK REMOVED
# CLERK_PUBLISHABLE_KEY="pk_test_..." # Not needed - auth removed
# CLERK_SECRET_KEY="sk_test_..." # Not needed - auth removed

# Weather APIs
OPENWEATHER_API_KEY="your_api_key_here"

# Storage (Docker Containerized MinIO)
MINIO_ENDPOINT="localhost:9000"
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_BUCKET_NAME="brave-forms-storage"

# Application (Updated Ports)
NODE_ENV="development"
BACKEND_PORT="3002"
WEB_PORT="3007"
CORS_ORIGIN="http://localhost:3007"
```

### 4. Database Setup

#### Install PostgreSQL with TimescaleDB
```bash
# macOS
brew install postgresql@15
brew install timescaledb

# Windows (use installer from postgresql.org and timescale.com)
# Linux
sudo apt install postgresql-15 postgresql-15-timescaledb
```

#### Create Database
```bash
psql -U postgres
CREATE DATABASE brave_forms;
\c brave_forms
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "timescaledb";
\q
```

#### Run Migrations
```bash
pnpm db:generate
pnpm db:migrate
```

### 5. Redis Setup

#### Install Redis
```bash
# macOS
brew install redis
brew services start redis

# Windows (use WSL or Docker)
docker run -d -p 6379:6379 redis:7-alpine

# Linux
sudo apt install redis-server
sudo systemctl start redis
```

## Running the Application

### Current Working Configuration (September 6, 2025)

#### Start Infrastructure (Docker Compose)
```bash
# Start PostgreSQL, Redis, MinIO containers
docker-compose up -d

# Verify containers are running
docker-compose ps
# ✅ PostgreSQL: Port 5434
# ✅ Redis: Port 6381  
# ✅ MinIO: Port 9000/9001
```

#### Start Development Applications
```bash
# Start all applications (recommended)
pnpm dev

# OR start individually:
# Backend API (GraphQL on http://localhost:3002/graphql)
pnpm --filter backend dev

# Web Application (http://localhost:3007) ✅ WORKING
pnpm --filter web dev

# Mobile Development (http://localhost:5174)
pnpm --filter mobile dev
```

### Verified Working URLs
- **Backend GraphQL**: http://localhost:3002/graphql ✅
- **Web Application**: http://localhost:3007 ✅
- **Demo Page**: http://localhost:3007/demo ✅
- **Mobile App**: http://localhost:5174 ✅
- **MinIO Console**: http://localhost:9001 ✅

## Development Workflow

### 1. Creating a New Feature

1. Create feature branch:
```bash
git checkout -b feature/your-feature-name
```

2. Update database schema if needed:
```bash
# Edit packages/database/schema.prisma
pnpm db:generate
pnpm db:migrate
```

3. Implement backend changes:
- Create/update modules in `apps/backend/src/modules/`
- Follow NestJS modular architecture
- Add GraphQL resolvers with proper decorators

4. Implement frontend changes:
- Update components in `apps/web/` or `apps/mobile/`
- Use Mantine v7 components
- Implement offline-first with TanStack Query

5. Write tests:
```bash
# Backend tests
pnpm test:backend

# Frontend tests
pnpm test:web

# Mobile tests
pnpm test:mobile
```

### 2. Code Quality Checks

Before committing:
```bash
# Run all quality checks
pnpm qa

# Individual checks
pnpm lint
pnpm type-check
pnpm test
```

### 3. EPA Compliance Testing

Test 0.25" rain threshold:
```bash
pnpm test:compliance
```

### 4. Offline Testing

Test 30-day offline capability:
```bash
pnpm test:offline
```

## Mobile Development

### iOS Setup (macOS only)
1. Install Xcode from App Store
2. Install CocoaPods:
```bash
sudo gem install cocoapods
```

3. Open iOS project:
```bash
pnpm mobile:ios
```

### Android Setup
1. Install Android Studio
2. Configure Android SDK (API 33+)
3. Open Android project:
```bash
pnpm mobile:android
```

### Building Mobile Apps
```bash
# Build for iOS
pnpm mobile:build:ios

# Build for Android
pnpm mobile:build:android
```

## Database Management

### Prisma Studio (GUI)
```bash
pnpm db:studio
```
Opens at http://localhost:5555

### Seeding Data
```bash
pnpm db:seed
```

### Reset Database
```bash
pnpm db:migrate:reset
```

## API Development

### GraphQL Playground
1. Start backend: `pnpm dev:backend`
2. Open http://localhost:3001/graphql
3. Use Clerk JWT token in headers:
```json
{
  "Authorization": "Bearer YOUR_CLERK_TOKEN"
}
```

### Testing API with Sample Queries

```graphql
# Get current user
query GetCurrentUser {
  me {
    id
    email
    organization {
      id
      name
    }
  }
}

# Check weather for project
query CheckWeather($projectId: String!) {
  checkProjectWeather(projectId: $projectId) {
    exceeded
    amount
    requiresInspection
  }
}
```

## Troubleshooting

### Common Issues

1. **Port already in use**
```bash
# Find process using port
lsof -i :3001
# Kill process
kill -9 <PID>
```

2. **Database connection failed**
- Check PostgreSQL is running
- Verify DATABASE_URL in .env.local
- Ensure database exists

3. **Redis connection failed**
- Check Redis is running
- Verify REDIS_URL in .env.local

4. **Authentication removed (September 6, 2025)**
- Clerk authentication has been completely removed
- No authentication setup required for development
- All features accessible without login barriers
- Mock authentication headers used for API compatibility

### Getting Help

- Check [CLAUDE.md](./CLAUDE.md) for architecture details
- Review existing issues on GitHub
- Contact team lead for Clerk/AWS credentials

## VS Code Settings

Recommended `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.updateImportsOnFileMove.enabled": "always"
}
```

## Important Notes

- **EPA Compliance**: Always test 0.25" exact threshold (not 0.24" or 0.26")
- **Offline Mode**: Ensure all features work for 30 days offline
- **Multi-tenancy**: Test with mock organization IDs (auth removed)
- **Mobile Testing**: Test with construction gloves and in sunlight
- **Development Mode**: No authentication required - all features accessible
- **Port Configuration**: Use updated port numbers (Backend: 3002, Web: 3007)

## Next Steps

1. Review [CLAUDE.md](./CLAUDE.md) for coding standards
2. Explore existing codebase structure
3. Join team standup meetings
4. Pick a task from the sprint board
5. Create your first PR!

---

**Remember**: This platform prevents $25,000-$50,000 daily EPA fines. Quality and accuracy are paramount!

---

## 🚨 Current Development Status (September 6, 2025)

### ✅ FULLY OPERATIONAL ENVIRONMENT
- **Infrastructure**: Docker containerized services working perfectly
- **Web Application**: http://localhost:3007 - Complete functionality
- **Backend API**: http://localhost:3002 - All endpoints operational
- **Authentication**: Removed for development ease - No barriers
- **Demo Features**: Weather monitoring, form builder, EPA compliance

### 🎯 Ready for Sprint 3
- Core functionality tested and working
- Development environment stable and fast
- All EPA compliance features operational
- Team productivity at maximum efficiency
- Focus can shift to UI/UX improvements

### 📞 Next Session Priorities
1. UI/UX styling improvements
2. Advanced form builder features
3. Mobile optimization enhancements
4. Performance fine-tuning
5. Sprint 3 planning and execution