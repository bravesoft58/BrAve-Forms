# BrAve Forms - Construction Compliance Platform

## CRITICAL: EPA 0.25" Rain Trigger Compliance Platform

BrAve Forms is a mobile-first construction compliance platform that helps construction companies avoid $25,000-$50,000 daily EPA fines through automated SWPPP management and weather-triggered inspections.

### Mission Statement

Transform construction compliance from a paper-based liability into a digital competitive advantage, ensuring 100% EPA SWPPP compliance while reducing documentation time from 3 hours to 30 minutes daily.

### Business Value

- **ROI**: 300% return on investment within 12 months
- **Fine Avoidance**: Prevent $25,000-$50,000 daily EPA violations
- **Time Savings**: Reduce compliance documentation by 70%
- **Market Size**: $2.3B addressable market (30,000+ construction companies)

### Key Features

- **EPA 0.25" Rain Trigger**: Automatic inspection alerts within 24 hours (EXACT threshold, not approximated)
- **30-Day Offline Capability**: Full functionality without internet connection
- **QR Inspector Access**: Instant compliance document access without app installation
- **Multi-tenant Architecture**: Complete data isolation with Clerk + PostgreSQL RLS
- **Field-Optimized UI**: Works with gloves, in sunlight, and harsh conditions
- **Weather Monitoring**: NOAA + OpenWeatherMap dual-source accuracy
- **Photo Documentation**: GPS-tagged photos with automatic compression
- **BMP Management**: Track Best Management Practices with maintenance schedules
- **Digital Signatures**: Legally-compliant electronic signature capture
- **Violation Tracking**: Document and resolve compliance issues

## Project Structure

```
brave-forms/
├── apps/
│   ├── backend/         # NestJS GraphQL API
│   ├── web/            # Next.js web application
│   └── mobile/         # Capacitor mobile app
├── packages/
│   ├── database/       # Prisma schemas & migrations
│   ├── types/          # Shared TypeScript types
│   └── compliance/     # EPA/OSHA rules engine
├── infrastructure/
│   ├── terraform/      # AWS IaC
│   ├── docker/         # Container configurations
│   └── k8s/           # Kubernetes manifests
├── agents/            # AI development agents (17 specialized agents)
├── docs/
│   ├── design/        # Architecture & design documents
│   └── form-samples/  # EPA/OSHA form templates
└── [Legacy folders - To be migrated]
```

## Documentation

### Core Documentation (`docs/design/`)

- **[Product Vision](docs/design/brave-forms-product-vision.md)** - Market opportunity and strategic vision
- **[Business Case](docs/design/brave-forms-business-case.md)** - ROI analysis and investment justification
- **[Product Requirements](docs/design/comprehensive_compliance_prd.md)** - Detailed PRD with compliance focus
- **[Technical Architecture](docs/design/revised_architecture_clerk.md)** - System design with Clerk auth
- **[Software Architecture](docs/design/brave-forms-sad.md)** - Detailed software architecture document
- **[API Design](docs/design/brave-forms-api-icd.md)** - GraphQL API interface control document
- **[Database Design](docs/design/database%20design%20document.md)** - PostgreSQL schema with JSONB
- **[UX Design](docs/design/brave-forms-ux-design-doc.md)** - Field-optimized UI specifications

### Requirements Documents (`docs/design/`)

- **[Product Positioning](docs/design/product_positioning.md)** - Market positioning and go-to-market strategy
- **[Non-Functional Requirements](docs/design/brave-forms-nfr.md)** - Performance, security, compliance
- **[Use Cases](docs/design/brave-forms-use-cases.md)** - User scenarios and workflows

### EPA/OSHA Form Samples (`docs/form-samples/`)

Real-world construction compliance forms that BrAve Forms digitizes:

- **[BrAve Inspection Logs](docs/form%20samples/BrAve%20-%20Inspection%20Logs.docx)** - Digital inspection form templates
- **[Weekly SWPP Inspection](docs/form%20samples/Weekly%20SWPP%20Inspection.pdf)** - EPA SWPPP inspection forms
- **[Weekly Stormwater Log](docs/form%20samples/Weekly%20Stormwater%20Log.pdf)** - Stormwater monitoring logs
- **[Daily Dust Logs](docs/form%20samples/Daily%20Dust%20Logs.pdf)** - Air quality compliance tracking
- **[Disturbance Map](docs/form%20samples/disturbance%20map%20w%20staging.pdf)** - Site mapping and staging areas
- **[City Approvals](docs/form%20samples/Completed%20Work%20Sign%20Off_City%20of%20Reno.pdf)** - Municipal sign-off forms
- **[File Organization Screenshots](docs/form%20samples/)** - Current paper-based filing systems

### Development Resources

- **[CLAUDE.md](CLAUDE.md)** - AI development instructions and guidelines (v1.6)
- **[Tech Stack Details](docs/TECH_STACK_DETAILS.md)** - Comprehensive technical stack documentation
- **[Common Pitfalls](docs/COMMON_PITFALLS.md)** - Development anti-patterns guide
- **[Document Library](docs/DOCUMENT_LIBRARY.md)** - Master documentation index
- **[Development Plan](docs/design/sdp-brave-forms.md)** - Software development plan (v2.0)
- **[AI Agents](.claude/agents/)** - 25 specialized development agents

### Legacy Documents

- **[System Architecture](To%20Be%20Updated/system%20architecture.md)** - Original architecture (to be migrated)
- **[Original README](To%20Be%20Updated/README.md)** - Previous project documentation

## Technology Stack

### Backend

- **Framework**: NestJS 10.x with GraphQL (Code-first)
- **Database**: PostgreSQL 15 with TimescaleDB
- **ORM**: Prisma 5.x with JSONB support
- **Queue**: BullMQ with Redis
- **Auth**: Clerk (JWT, multi-tenant organizations)

### Frontend

- **Web**: Next.js 14 (App Router) with Mantine v7
- **Mobile**: Capacitor 6 with React
- **State**: Valtio + TanStack Query
- **Forms**: React Hook Form + Zod validation
- **Offline**: Service Workers + IndexedDB

### Infrastructure

- **Local Dev**: Rancher Desktop (containerd + k3s + nerdctl)
- **Container Runtime**: containerd (production standard)
- **Image Building**: nerdctl with k8s.io namespace
- **Orchestration**: Kubernetes (k3s local, EKS production)
- **IaC**: Terraform 1.5+
- **CI/CD**: GitHub Actions
- **Monitoring**: Datadog, Sentry
- **CDN**: CloudFront
- **Storage**: S3 for photos

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 8+
- Rancher Desktop (latest version with containerd + k3s)
- kubectl (included with Rancher Desktop)

### Installation

```bash
# Install dependencies
pnpm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your values (Clerk keys required)

# Setup database
pnpm --filter @brave-forms/database migrate:dev

# Seed development data
pnpm --filter @brave-forms/backend seed
```

### Development

```bash
# Run all apps in development mode
pnpm dev

# Or run individually:
pnpm --filter @brave-forms/backend dev
pnpm --filter @brave-forms/web dev
pnpm --filter @brave-forms/mobile dev
```

### Mobile Development

```bash
# Build and sync Capacitor
pnpm --filter @brave-forms/mobile cap:build

# Open iOS project
pnpm --filter @brave-forms/mobile cap:ios

# Open Android project
pnpm --filter @brave-forms/mobile cap:android
```

### Kubernetes Development (Rancher Desktop)

```bash
# Deploy all services to Kubernetes
.\scripts\k8s-local-setup.ps1 -Action deploy -BuildImages -CreateSecrets

# Check deployment status
.\scripts\k8s-local-setup.ps1 -Action status

# View pod logs
kubectl logs -f deployment/backend -n braveforms

# Remove deployment
.\scripts\k8s-local-setup.ps1 -Action remove
```

**Services Available:**

- Backend GraphQL: http://localhost:30101/graphql
- Web Application: http://localhost:30102
- MinIO Console: http://localhost:30103

## Testing

```bash
# Run all tests
pnpm test

# Run compliance-specific tests (CRITICAL)
pnpm test:compliance

# Run offline functionality tests
pnpm test:offline

# Run E2E tests
pnpm test:e2e
```

## Quality Assurance

```bash
# Run full QA suite (required before commits)
pnpm qa

# Individual checks:
pnpm lint
pnpm type-check
pnpm test
```

## EPA Compliance Requirements

### Critical Thresholds

- **Precipitation**: EXACTLY 0.25 inches triggers inspection requirement
- **Deadline**: 24 hours from precipitation event (during working hours)
- **Fines**: $25,000 - $50,000 per day for non-compliance

### Testing Compliance

```bash
# Verify 0.25" threshold accuracy
pnpm --filter @brave-forms/compliance test:epa-threshold

# Test weather API integration
pnpm --filter @brave-forms/backend test:weather

# Validate inspection deadlines
pnpm --filter @brave-forms/compliance test:deadlines
```

## Field Testing Checklist

Before deployment, ensure:

- [ ] Works with construction gloves
- [ ] Visible in direct sunlight
- [ ] Functions in rain/dust conditions
- [ ] Operates without connectivity for 30 days
- [ ] Handles interrupted operations gracefully
- [ ] Syncs successfully when connection restored
- [ ] QR codes scan from 3+ feet away
- [ ] Photos include GPS metadata

## Deployment

### Production Build

```bash
# Build all apps
pnpm build

# Deploy database migrations
pnpm --filter @brave-forms/database migrate:deploy

# Build container images (Rancher Desktop + nerdctl)
nerdctl -n k8s.io build -f infrastructure/docker/Dockerfile.backend -t brave-forms-backend .
nerdctl -n k8s.io build -f infrastructure/docker/Dockerfile.web -t brave-forms-web .
```

### Infrastructure

```bash
# Deploy AWS infrastructure
cd infrastructure/terraform
terraform init
terraform plan
terraform apply

# Deploy to Kubernetes
kubectl apply -f infrastructure/k8s/
```

## Monitoring

- **Health Check**: `GET /health`
- **Metrics**: `GET /metrics`
- **GraphQL Playground**: `http://localhost:4000/graphql`

## Security & Compliance

### Security Features

- **Multi-tenant Isolation**: Clerk Organizations + PostgreSQL RLS
- **Authentication**: JWT tokens with org context (o.id, o.rol, o.slg)
- **Data Encryption**: TLS 1.3 in transit, AES-256 at rest
- **Zero-trust Architecture**: All requests authenticated and authorized
- **SOC 2 Type II**: Compliance-ready infrastructure
- **OWASP Top 10**: Protection against common vulnerabilities
- **API Rate Limiting**: DDoS protection via WAF

### Regulatory Compliance

- **EPA CGP 2022**: Full SWPPP compliance automation
- **OSHA 29 CFR 1926**: Construction safety standards
- **State Requirements**: CA CASQA, TX TCEQ, FL NPDES support
- **Data Privacy**: CCPA/GDPR compliant data handling
- **Audit Trail**: 7-year retention for all compliance records

## Development Team

### AI Development Agents

The project includes 17 specialized AI agents to accelerate development:

**Core Development**

- Database Schema Architect - Multi-tenant PostgreSQL with JSONB
- Offline Sync Specialist - 30-day offline capability implementation
- API Integration Architect - NestJS/GraphQL API design
- Mobile App Builder - Capacitor 6 field-optimized apps

**Compliance & Features**

- Compliance Engine Developer - EPA/OSHA rules implementation
- Weather Integration Specialist - 0.25" rain monitoring
- QR Inspector Portal Developer - Inspector access system
- Photo Storage Optimizer - Hybrid S3/local storage

**Infrastructure & Quality**

- DevOps Pipeline Engineer - CI/CD and Kubernetes
- Security Compliance Officer - SOC 2 and zero-trust
- Test Automation Engineer - 80% coverage target
- Performance Optimizer - Sub-200ms API response

**Management & Documentation**

- Scrum Master - Agile facilitation for compliance deadlines
- Project Manager - $1M budget and timeline management
- Product Owner - Construction industry expertise
- Infrastructure Designer - Terraform IaC specialist
- Technical Writer - Field worker and developer documentation

## Contributing

1. Review `CLAUDE.md` for AI-assisted development guidelines
2. Follow EPA compliance requirements exactly
3. Test with field conditions in mind
4. Ensure 30-day offline capability isn't broken
5. Run `pnpm qa` before committing

### Development Workflow

```bash
# Create feature branch
git checkout -b feature/epa-rain-trigger

# Make changes and test
pnpm test:compliance
pnpm test:offline

# Run quality checks
pnpm qa

# Commit with conventional commits
git commit -m "feat: implement 0.25 inch rain threshold detection"
```

## Project Status

### Current Phase: Sprint 3 - Forms UI with Navigation (66% Complete)

**Completed:**

- ✅ Project structure created
- ✅ Documentation complete
- ✅ Technology stack defined
- ✅ AI agents configured
- ✅ Sprint 1: Backend foundation (Forms engine, Photos, Submissions)
- ✅ Sprint 2: Form Builder UI
- ✅ Sprint 3 Phase 1: Navigation Layer (8/8 issues)
- ✅ Sprint 3 Phase 2: Core Pages (6/6 issues)
- ✅ Sprint 3 Phase 3: Single-Tenant Simplification (3/3 issues)
- ✅ Sprint 3 Phase 4: Dynamic Form Renderer (6/6 issues)
  - ✅ FormRenderer Component (ISSUE-093)
  - ✅ 15 Field Types Implementation (ISSUE-094)
  - ✅ Conditional Display Logic (ISSUE-095)
  - ✅ Computed Fields (ISSUE-096)
  - ✅ Form Validation (ISSUE-097)
  - ✅ Auto-Save Draft Functionality (ISSUE-098)

**In Progress:**

- 🔄 Sprint 3 Phase 5: Form Submission Workflow (0/6 issues)
- 🔄 Sprint 3 Phase 6: Form Cloning (0/4 issues)
- 🔄 Sprint 3 Phase 7: Testing & Polish (0/5 issues)

**Pending:**

- ⏳ Sprint 4: Advanced Features & Templates
- ⏳ Beta customer onboarding (Q&D Construction)
- ⏳ Production deployment

**Sprint 3 Progress:** 25/38 issues complete (66%)

### Milestones

- **Q1 2025**: MVP with EPA compliance features
- **Q2 2025**: Mobile apps and offline capability
- **Q3 2025**: OSHA integration and enterprise features
- **Q4 2025**: Market expansion and acquisition readiness

## License

Proprietary - BrAve Forms LLC. All rights reserved.

## Support

- **Technical Issues**: support@braveforms.com
- **Compliance Questions**: compliance@braveforms.com
- **Sales Inquiries**: sales@braveforms.com
- **Emergency Hotline**: 1-888-BRAVE-01

## Acknowledgments

- EPA for Construction General Permit guidelines
- OSHA for construction safety standards
- Construction industry advisors and beta customers
- Open source community for amazing tools

---

**CRITICAL REMINDER**: This platform prevents construction companies from facing $25,000-$50,000 daily EPA fines. Every feature must be field-tested and compliance-validated. Zero tolerance for compliance inaccuracy.

**Built for Construction, By Construction** - Designed with muddy gloves, tested in the rain, proven on job sites.
