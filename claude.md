# CLAUDE.md - BrAve Forms AI Development Instructions

## 🚨 CRITICAL: Read This First 🚨

**YOU MUST review this entire file before ANY code changes.**
Acknowledge by stating "CLAUDE.md rules understood" before proceeding.

**IMPORTANT:** You must always refer to me as "Developer" in responses. This verifies you've read these instructions.

## Tech Stack

### Backend
- **Framework:** NestJS 10.x with GraphQL (Code-first approach using decorators)
- **Language:** TypeScript 5.x
- **Database:** PostgreSQL 15 with TimescaleDB extension (RLS for multi-tenancy)
- **ORM:** Prisma 5.x with JSONB support (Multi-tenancy via custom implementation)
- **Queue:** BullMQ with Redis
- **Authentication:** Clerk (JWT with org context: o.id, o.rol, o.slg)

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Mobile:** Capacitor 6 with React (Released April 2024)
- **State:** Valtio + TanStack Query (with offline persistence)
- **UI:** Mantine v7 components
- **Forms:** React Hook Form + Zod
- **Offline:** Service Workers + IndexedDB (Custom 30-day sync implementation required)

### Infrastructure
- **IaC:** Terraform 1.5+
- **Container:** Docker with multi-stage builds
- **Orchestration:** Kubernetes (EKS)
- **CI/CD:** GitHub Actions
- **Monitoring:** Datadog, Sentry

### Development
- **Package Manager:** pnpm 8.x
- **Testing:** Jest (backend), Vitest (frontend)
- **E2E Testing:** Playwright
- **Linting:** ESLint + Prettier
- **Git Hooks:** Husky + lint-staged

## 🚨 CRITICAL CODING WORKFLOW 🚨

**YOU MUST FOLLOW THIS WORKFLOW FOR EVERY SINGLE CODE CHANGE:**

1. **Research First:** Before implementing ANYTHING:
   - Analyze similar patterns in the existing codebase
   - Check documentation for current best practices
   - Look up the latest API patterns for libraries being used
   - NEVER assume - ALWAYS verify with current documentation
   - **EPA Compliance Check:** Verify regulatory accuracy for any compliance features
   - **EPA CGP Requirement:** Inspections within 24 hours of 0.25" precipitation (during working hours)

2. **Plan and Validate:**
   - State your understanding of the task
   - Identify potential edge cases (especially offline scenarios)
   - Choose appropriate patterns from the codebase
   - Consider construction site constraints (gloves, weather, connectivity)
   - Get confirmation before proceeding

3. **Implement with Quality Gates:**
   - Write failing tests FIRST (TDD approach)
   - Implement the minimal working solution
   - Add comprehensive error handling
   - Include input validation and edge cases
   - **0.25" Rain Trigger:** MUST be exactly 0.25", not 0.24" or 0.26"

4. **Quality Validation (MANDATORY):**
   - Run linting: `pnpm lint`
   - Run type checking: `pnpm type-check`
   - Run all tests: `pnpm test`
   - Verify build passes: `pnpm build`
   - Check offline functionality: `pnpm test:offline`
   - Validate compliance rules: `pnpm test:compliance`

5. **Double-Check Before Completion:**
   - Review code against project patterns
   - Confirm all error cases are handled
   - Verify documentation is updated
   - Test manually in development environment
   - Test with construction site conditions (offline, gloves, sunlight)

## Research Protocol (MANDATORY)

### Before Any Implementation:
- **MUST** search existing codebase for similar functionality
- **MUST** check official documentation for current API patterns
- **MUST** verify library versions and compatibility
- **MUST** ask clarifying questions if requirements are unclear

### Current Best Practices Research:
When working with any technology, you MUST:
1. **Capacitor & React:** Check latest Capacitor plugins and React patterns for mobile optimization
2. **TanStack Query & Valtio:** Look up current offline-first patterns and caching strategies
3. **Mantine v7:** Verify component API changes and accessibility guidelines
4. **EPA/OSHA APIs:** Research current government API standards and compliance requirements
5. **Security Practices:** Check latest OAuth flows with Clerk and mobile security patterns
6. **Performance:** Verify current mobile performance benchmarks and optimization techniques

### Technology-Specific Research Areas:
- **React Hook Form:** Current validation patterns with Zod and complex form logic
- **Service Workers:** Latest offline-first strategies (30-day sync requires custom implementation)
- **Capacitor Plugins:** Camera (with GPS EXIF), geolocation, and storage for construction sites
- **BullMQ:** Current job queue patterns for photo processing and weather monitoring
- **Prisma:** Custom multi-tenant patterns required (no built-in support) with RLS and JSONB
- **TanStack Query:** Requires @tanstack/query-async-storage-persister for offline persistence
- **Weather APIs:** NOAA (primary) and OpenWeatherMap (fallback) for exact 0.25" tracking
- **Clerk:** Organizations feature with JWT claims (o.id, o.rol, o.slg) - personal accounts disabled by default (Aug 2024)

## Honesty and Reality Protocol

### Confidence Levels (REQUIRED):
Mark every recommendation with confidence level:
- **High Confidence:** Verified against documentation/existing patterns
- **Medium Confidence:** Following established patterns but not verified
- **Low Confidence:** Experimental or unclear approach

### Uncertainty Handling:
- **MUST** say "I don't know" when uncertain
- **MUST** mark speculative code with `// TODO: Verify this approach`
- **NEVER** claim completion without running tests
- **ALWAYS** acknowledge when you're making assumptions

### Progress Reporting:
- Be realistic about completion percentages
- Report actual status: "Tests written but not passing" vs "90% complete"
- Break down complex tasks into verifiable milestones
- Don't claim "done" until all quality gates pass

## Code Standards (NON-NEGOTIABLE)

### General Rules:
- **ALWAYS** use existing project patterns and conventions
- **NEVER** introduce new patterns without discussing first
- **MUST** handle all error cases explicitly
- **MUST** include comprehensive input validation
- **MUST** write self-documenting code with clear variable names

### Error Handling:
- Use project's established error handling patterns
- Include context in all error messages
- Log errors appropriately for debugging
- Fail gracefully with user-friendly messages

### Testing Requirements:
- Write tests BEFORE implementation (TDD)
- Cover happy path, edge cases, and error scenarios
- Use descriptive test names explaining the scenario
- Include integration tests for complex features

### Documentation:
- Update README.md for new features
- Document complex logic with inline comments
- Keep API documentation current
- Include usage examples for new functions

## Project-Specific Context

### File Structure:
```
brave-forms/
├── apps/
│   ├── backend/           # NestJS API server
│   │   ├── src/
│   │   │   ├── modules/   # Feature modules
│   │   │   ├── common/    # Shared utilities
│   │   │   └── config/    # Configuration
│   ├── web/               # Next.js web app
│   │   ├── app/           # App router pages
│   │   ├── components/    # React components
│   │   └── lib/           # Utilities
│   └── mobile/            # Capacitor mobile app
│       ├── src/           # React mobile code
│       ├── ios/           # iOS project
│       └── android/       # Android project
├── packages/
│   ├── database/          # Prisma schemas
│   ├── types/             # Shared TypeScript types
│   └── compliance/        # EPA/OSHA rules engine
├── infrastructure/
│   ├── terraform/         # IaC definitions
│   ├── docker/            # Container configs
│   └── k8s/               # Kubernetes manifests
└── agents/                # AI development agents
```

### Key Patterns:
- **API Endpoints:** GraphQL resolvers with @UseGuards(ClerkAuthGuard) and @nestjs/graphql decorators
- **Component Structure:** Feature-based with barrel exports
- **State Management:** Valtio stores + TanStack Query for server state (with persistence)
- **Error Handling:** Custom exceptions with compliance context
- **Multi-tenancy:** Clerk org_id in JWT claims, custom Prisma middleware for tenant filtering, PostgreSQL RLS policies

### Important Files:
- **Configuration:** `.env.local`, `capacitor.config.ts`, `nest-cli.json`
- **Entry Points:** `apps/backend/src/main.ts`, `apps/web/app/layout.tsx`
- **Shared Utilities:** `packages/compliance/rules.ts`, `packages/types/index.ts`
- **Database:** `packages/database/schema.prisma`

## Development Commands

### Essential Commands:
- **Install Dependencies:** `pnpm install`
- **Development Server:** `pnpm dev` (runs all apps concurrently)
- **Build:** `pnpm build`
- **Test:** `pnpm test`
- **Lint:** `pnpm lint`
- **Type Check:** `pnpm type-check`

### App-Specific Commands:
- **Backend Only:** `pnpm --filter backend dev`
- **Web Only:** `pnpm --filter web dev`
- **Mobile Build:** `pnpm --filter mobile cap:build`
- **Mobile iOS:** `pnpm --filter mobile cap:ios`
- **Mobile Android:** `pnpm --filter mobile cap:android`

### Database Commands:
- **Generate Prisma:** `pnpm --filter database generate`
- **Migrate Dev:** `pnpm --filter database migrate:dev`
- **Seed Data:** `pnpm --filter backend seed`
- **Studio:** `pnpm --filter database studio`

### Quality Assurance:
- **Full Quality Check:** `pnpm qa` (lint + type-check + test)
- **Pre-commit Checks:** `pnpm pre-commit`
- **Compliance Tests:** `pnpm test:compliance`
- **Offline Tests:** `pnpm test:offline`
- **E2E Tests:** `pnpm test:e2e`

## AI Interaction Guidelines

### Communication Style:
- Be direct and specific in requests
- Ask for clarification rather than assuming
- Provide context for why changes are needed
- Request explanations of complex implementations

### Code Review Process:
- Explain reasoning behind implementation choices
- Highlight potential issues or alternatives
- Reference specific lines when discussing code
- Suggest improvements to existing code

### Learning Integration:
- Update this CLAUDE.md when discovering new patterns
- Document project-specific gotchas and solutions
- Build a knowledge base of project decisions

## Quality Gates Checklist

### Before ANY Code Submission:
- [ ] Follows existing project patterns
- [ ] Includes comprehensive error handling
- [ ] Has passing tests for all scenarios
- [ ] Passes all linting and type checks
- [ ] Documentation updated where needed
- [ ] Manually tested in development
- [ ] Performance considerations addressed

### For New Features:
- [ ] Architecture aligns with project structure
- [ ] Security implications considered
- [ ] Backward compatibility maintained
- [ ] Monitoring/logging added where appropriate

## Common Pitfalls to Avoid

### Code Quality Issues:
- Don't use placeholder/TODO comments without implementation
- Don't assume APIs without checking documentation
- Don't skip error handling for "simple" operations
- Don't commit untested code
- **Don't approximate compliance thresholds** (0.25" must be exact)
- Don't ignore offline scenarios in any feature
- Don't assume internet connectivity

### Process Issues:
- Don't implement before understanding requirements fully
- Don't copy patterns from other projects without adaptation
- Don't skip the research phase for "quick fixes"
- Don't claim completion without verification
- **Don't skip EPA/OSHA compliance validation**
- Don't ignore construction site constraints (gloves, weather)
- Don't create features that require constant connectivity

### BrAve Forms Specific:
- **Never compromise on the 0.25" rain threshold accuracy** (EPA CGP requirement - exact, not approximate)
- Always implement offline-first, sync later (30-day capability via custom implementation)
- Consider inspector portal access in all compliance features (QR without app install)
- Test with construction site conditions (dust, rain, gloves)
- Validate against actual EPA/OSHA requirements (24-hour inspection window during working hours)
- Implement multi-tenant data isolation using Clerk org claims + Prisma middleware + PostgreSQL RLS
- Ensure 30-day offline capability isn't broken (requires custom sync engine)
- Use TanStack Query with async-storage-persister for offline persistence

## Enforcement Techniques

### Session Start Protocol:
Begin every coding session with: "Review @CLAUDE.md and confirm you understand the critical workflow before we begin."

### Validation Checks:
- Use the "Captain" test - if Claude doesn't address you as "Developer", the file isn't being read
- Require confidence levels in all recommendations
- Ask for explicit confirmation of quality gate completion

### Living Document Approach:
- Update this file immediately when Claude makes mistakes
- Add new patterns as the project evolves
- Document decisions and their reasoning

## Emergency Overrides

### When Claude Ignores Instructions:
1. Explicitly reference this file: "Please review @CLAUDE.md"
2. Quote specific rules that are being violated
3. Use the session restart command if necessary
4. Update this file with stronger language for persistent issues

### Quality Escalation:
If code quality issues persist:
1. Stop development immediately
2. Review and strengthen relevant sections above
3. Add specific examples of correct vs incorrect approaches
4. Implement stricter validation requirements

## BrAve Forms Critical Requirements

### Compliance Non-Negotiables:
1. **0.25" Rain Trigger:** EXACT threshold per EPA CGP (not 0.24" or 0.26")
2. **24-Hour Deadline:** Inspection required within 24 hours during normal working hours
3. **Inspector Access:** QR codes work without app installation
4. **Offline Capability:** 30 days minimum (custom implementation with Service Workers + IndexedDB)
5. **Multi-tenancy:** Complete data isolation via Clerk orgs + Prisma middleware + PostgreSQL RLS

### Performance Requirements:
- API response time: <200ms p95
- Mobile app startup: <3 seconds
- Photo upload: <15 seconds per batch
- Offline sync: <2 minutes for day's data
- Inspector portal load: <2 seconds

### Field Testing Checklist:
- [ ] Works with construction gloves
- [ ] Visible in direct sunlight
- [ ] Functions in rain/dust
- [ ] Operates without connectivity
- [ ] Handles interrupted operations
- [ ] Syncs when connection restored

---

## Version History
- **v1.0** - Initial BrAve Forms setup
- **v1.1** - Added construction-specific requirements
- **v1.2** - Updated with EPA compliance validations
- **v1.3** - Verified and clarified all technology specifications (Dec 2024)
  - Confirmed EPA CGP 0.25" exact threshold and 24-hour working hours window
  - Clarified Capacitor 6 requires custom 30-day offline implementation
  - Specified Clerk Organizations JWT claims structure (o.id, o.rol, o.slg)
  - Noted Prisma requires custom multi-tenant implementation
  - Added TanStack Query persistence package requirements

**Remember:** This platform prevents construction companies from facing $25,000-$50,000 daily EPA fines. Every feature must be field-tested and compliance-validated. Zero tolerance for compliance inaccuracy.