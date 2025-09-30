# CLAUDE.md - BrAve Forms AI Development Instructions

## 🚨 CRITICAL: Read This First 🚨

**YOU MUST review this entire file before ANY code changes.**
Acknowledge by stating "CLAUDE.md rules understood" before proceeding.

**IMPORTANT:** You must always refer to me as "Developer" in responses. This verifies you've read these instructions.

## ABSOLUTE CODE STANDARDS - ZERO TOLERANCE

**NEVER include in ANY code, commits, PRs, or documentation:**
1. Emoji characters of any kind
2. "Generated with Claude Code" or any AI branding
3. "Co-Authored-By: Claude" in commits
4. Any anthropic.com links or references
5. Robot emoji or any decorative characters

**Violation of these rules = immediate session restart**

All code must be production-ready, professional, and contain ZERO references to AI generation.

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
- **Local Dev:** Rancher Desktop (containerd + k3s + nerdctl)
- **Production:** Kubernetes (EKS)
- **Container Runtime:** containerd (production standard)
- **Image Building:** nerdctl with k8s.io namespace
- **IaC:** Terraform 1.5+
- **CI/CD:** GitHub Actions
- **Monitoring:** Datadog, Sentry
- **Namespace:** braveforms (local isolation)

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

### Absolute Prohibitions:
1. **NO EMOJI** - Never use emoji in code, comments, commits, or documentation
2. **NO AI BRANDING** - Never mention Claude, AI generation, or include links
3. **NO DECORATIVE CHARACTERS** - Only standard ASCII in code and comments
4. **NO PLACEHOLDER COMMENTS** - Complete implementation or mark with TODO + ticket reference

### General Rules:
- **ALWAYS** use existing project patterns and conventions
- **NEVER** introduce new patterns without discussing first
- **MUST** handle all error cases explicitly
- **MUST** include comprehensive input validation
- **MUST** write self-documenting code with clear variable names
- **MUST** consider offline scenarios in ALL features
- **MUST** validate multi-tenant data isolation

### Error Handling:
- Use project's established error handling patterns
- Include context in all error messages (no generic "Error occurred")
- Log errors with sufficient debugging information
- Fail gracefully with user-friendly messages
- Consider offline error scenarios (queue for sync)

### Testing Requirements (TDD):
- Write failing tests FIRST, then implement
- Cover: happy path, edge cases, error scenarios, offline scenarios
- Use descriptive test names: `should <expected behavior> when <condition>`
- Include integration tests for complex features
- Test multi-tenancy isolation explicitly
- Test EPA/OSHA compliance rules with regulatory citations

### Multi-Tenancy Requirements:
- EVERY query must filter by orgId from Clerk JWT
- Use Prisma middleware for automatic tenant filtering
- Verify PostgreSQL RLS policies exist for tenant tables
- Test cross-tenant access attempts fail
- Include orgId in all audit trail entries

### Offline-First Requirements:
- ALL features must work offline for 30 days
- Use Service Workers + IndexedDB for persistence
- Implement delta sync with conflict resolution
- Queue operations when offline, sync when online
- Test storage persistence on iOS (consider SQLite for critical data)

### Documentation Standards:
- Update documentation IMMEDIATELY when APIs change
- Use JSDoc format for TypeScript/JavaScript
- Include: purpose, parameters, return types, examples, edge cases
- Document offline behavior and sync implications
- Document multi-tenancy considerations
- NO emoji in documentation
- NO AI branding in documentation

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

### Slash Commands (Preferred):
Use these custom slash commands for streamlined workflows:

**Quality Gates:**
- `/qa` - Run complete quality gate (lint + type-check + test + build)
- `/test-offline` - Test offline functionality and 30-day sync
- `/test-compliance` - Validate EPA CGP 0.25" rules and compliance
- `/review` - Launch code-reviewer agent with strict standards

**Workflow:**
- `/feature <name>` - Create feature branch and initialize structure
- `/fix <issue-number>` - Create fix branch and investigate issue
- `/commit-clean` - Commit after quality gates (NO branding)
- `/pr-ready` - Full validation and create PR (NO branding)

**Planning & Architecture:**
- `/plan-feature` - Architecture analysis in Plan Mode
- `/check-patterns <file>` - Verify code follows project patterns
- `/compliance-check <feature>` - Deep EPA/OSHA validation

**Database:**
- `/db-check` - Validate multi-tenancy and RLS patterns
- `/db-migrate-safe` - Create and validate migration

**Documentation:**
- `/doc-sync` - Update all affected documentation
- `/doc-api <path>` - Generate API documentation

**Specialized Agents:**
- `/agent-offline` - Launch offline-sync-specialist
- `/agent-compliance` - Launch compliance-engine-developer
- `/agent-security` - Launch security-compliance-officer

### Manual Commands (if slash commands unavailable):

**Essential:**
- **Install Dependencies:** `pnpm install`
- **Development Server:** `pnpm dev` (runs all apps concurrently)
- **Build:** `pnpm build`
- **Test:** `pnpm test`
- **Lint:** `pnpm lint`
- **Type Check:** `pnpm type-check`

**App-Specific:**
- **Backend Only:** `pnpm --filter backend dev`
- **Web Only:** `pnpm --filter web dev`
- **Mobile Build:** `pnpm --filter mobile cap:build`
- **Mobile iOS:** `pnpm --filter mobile cap:ios`
- **Mobile Android:** `pnpm --filter mobile cap:android`

**Database:**
- **Generate Prisma:** `pnpm db:generate`
- **Migrate Dev:** `pnpm db:migrate`
- **Seed Data:** `pnpm --filter backend seed`
- **Studio:** `pnpm --filter database studio`

**Kubernetes (Local Development):**
- **Deploy:** `.\scripts\k8s-local-setup.ps1 -Action deploy -BuildImages -CreateSecrets`
- **Status:** `.\scripts\k8s-local-setup.ps1 -Action status`
- **Build Images:** `.\scripts\k8s-local-setup.ps1 -Action build -BuildImages`
- **Remove:** `.\scripts\k8s-local-setup.ps1 -Action remove`
- **Port Check:** `.\scripts\check-port-conflicts.ps1 -PortsToCheck @(30101, 30102, 30103)`
- **Pod Logs:** `kubectl logs -f deployment/backend -n braveforms`
- **Port Forward:** `kubectl port-forward svc/postgres 5432:5432 -n braveforms`

**Quality Assurance:**
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

### Critical Violations (Zero Tolerance):
- Including emoji in code, comments, or documentation
- Adding "Generated with Claude Code" or AI references
- Adding Co-Authored-By lines for AI
- Using decorative characters instead of proper documentation
- Leaving TODO comments without implementation or ticket reference

### Code Quality Issues:
- Don't use placeholder/TODO comments without implementation
- Don't assume APIs without checking documentation
- Don't skip error handling for "simple" operations
- Don't commit untested code
- **Don't approximate compliance thresholds** (0.25" must be exact)
- Don't ignore offline scenarios in any feature
- Don't assume internet connectivity

### Pattern Violations:
- Creating new architectural patterns without discussion
- Ignoring existing error handling patterns
- Skipping input validation "because it's internal"
- Not considering offline scenarios
- Breaking multi-tenant isolation

### Testing Violations:
- Claiming code is done without tests
- Writing tests after implementation (not TDD)
- Skipping offline scenario tests
- Not testing multi-tenant isolation
- Approximating compliance thresholds (0.24" vs 0.25")

### Process Issues:
- Don't implement before understanding requirements fully
- Don't copy patterns from other projects without adaptation
- Don't skip the research phase for "quick fixes"
- Don't claim completion without verification
- **Don't skip EPA/OSHA compliance validation**
- Don't ignore construction site constraints (gloves, weather)
- Don't create features that require constant connectivity

### Documentation Violations:
- Not updating docs when APIs change
- Including emoji in documentation
- Adding AI branding to documentation
- Leaving outdated documentation

### Git Violations:
- Committing without passing quality gates
- Using emoji in commit messages
- Adding AI branding to commits or PRs
- Not following conventional commit format
- Pushing directly to main/master

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

### Session Start Protocol (MANDATORY):
Every session start:
1. Read CLAUDE.md completely
2. State "CLAUDE.md rules understood" and address Developer
3. Run `git status` to understand current state
4. Check for failing tests or lint errors
5. Review recent commits for context
6. Verify no emoji or branding in recent commits
7. If violations found, immediately flag for cleanup

### During Implementation (MANDATORY):
1. Use TodoWrite for ALL tasks requiring >2 steps
2. Use Plan Mode for features requiring >3 steps
3. Mark todos in_progress BEFORE starting
4. Mark todos completed IMMEDIATELY after finishing
5. Run `/review` after any significant change (>50 lines)
6. Scan code for emoji/branding before committing
7. Never claim "done" without passing `/qa`

### Before Commit (MANDATORY CHECKLIST):
- [ ] Run `/qa` or manual quality gates: pnpm lint && pnpm type-check && pnpm test && pnpm build
- [ ] Run `/test-offline` if touching sync/mobile
- [ ] Run `/test-compliance` if touching EPA/OSHA
- [ ] Scan diff for emoji: `git diff | grep -E '[\x{1F000}-\x{1F9FF}]'`
- [ ] Scan diff for "Claude Code" or anthropic.com
- [ ] Verify commit message has no emoji or branding
- [ ] Confirm all tests pass

### Before PR (MANDATORY CHECKLIST):
- [ ] All commits have clean messages (no emoji/branding)
- [ ] Run `/pr-ready` for full validation
- [ ] PR description has no emoji or branding
- [ ] All quality gates pass
- [ ] Documentation updated
- [ ] Compliance validated if applicable

### Git Workflow Standards:

**Branch Naming (REQUIRED):**
- `feature/<descriptive-name>` - New functionality
- `fix/<issue-number>-<brief>` - Bug fixes
- `refactor/<area>` - Code improvements
- `compliance/<regulation>-<feature>` - EPA/OSHA features
- `docs/<what-changed>` - Documentation updates

**Commit Message Format (REQUIRED):**
```
<type>: <brief summary under 72 characters>

<detailed explanation of WHY, not WHAT>

<optional footer for breaking changes or issue references>
```

**Types:** feat, fix, refactor, docs, test, compliance, perf, chore, security

**Example:**
```
compliance: implement EPA CGP 0.25 inch rain inspection trigger

Add weather monitoring integration with NOAA API to detect rain events
exceeding 0.25 inches within 24-hour periods. Automatically schedules
inspection within 24 hours during normal working hours per EPA CGP.

Implements exact 0.25 inch threshold with multiple storm accumulation
logic as specified in 2022 EPA Construction General Permit Section 4.4.

Refs: EPA-CGP-2022-Section-4.4
```

**ABSOLUTE RULES:**
- NO emoji anywhere in commit messages
- NO "Generated with Claude Code" or AI branding
- NO "Co-Authored-By: Claude" lines
- NO anthropic.com links

**Pull Request Template (REQUIRED):**
```markdown
## Summary
Brief description of changes

## Changes
- Specific change 1
- Specific change 2

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Offline scenarios tested (if applicable)
- [ ] Multi-tenant isolation verified (if applicable)
- [ ] Compliance validated (if applicable)

## Database Changes
- [ ] No schema changes / Schema changes documented

## Breaking Changes
- [ ] None / List if applicable

## Compliance Impact
- [ ] No EPA/OSHA rules affected / Rules updated with citations
```

### Validation Checks:
- Use the "Developer" test - if Claude doesn't address you as "Developer", the file isn't being read
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
2. **24-Hour Inspection Window:** Required within 24 hours of storm event producing ≥0.25" rain
   - "During normal working hours" means: If storm occurs Saturday, inspection due Monday (next work day)
   - Multiple storms totaling ≥0.25" within 24 hours = one inspection within 24 hours of accumulation
3. **Sensitive Waters:** 7-day inspection frequency + 24-hour post-storm (if ≥0.25")
4. **Working Hours Definition:** Project's normal business hours (not calendar hours)
5. **Storm Event Definition:** Any period producing ≥0.25" within 24-hour rolling window
6. **Inspector Access:** QR codes work without app installation
7. **Offline Capability:** 30 days minimum (custom implementation with Service Workers + IndexedDB)
8. **Multi-tenancy:** Complete data isolation via Clerk orgs + Prisma middleware + PostgreSQL RLS

**Reference:** 2022 EPA Construction General Permit Section 4.4
**Penalty for Non-Compliance:** $25,000-$50,000 per day

All compliance features must cite official EPA CGP documentation.

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

### iOS Storage Persistence (CRITICAL):
- [ ] Critical compliance data stored in SQLite, not IndexedDB
- [ ] IndexedDB used only for cache/performance data
- [ ] Tested storage under iOS low-space conditions
- [ ] Tested storage persistence after multi-day offline periods
- [ ] Fallback strategy implemented when iOS reclaims storage

**iOS Reality:** IndexedDB is transient on iOS. The OS WILL reclaim storage when device is low on space or storage unused for extended periods. Use `@capacitor/preferences` or `@capacitor-community/sqlite` for critical compliance data like inspection records, photos, and audit trails.

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
- **v1.4** - Added Claude Code workflows and enforcement (Jan 2025)
- **v1.5** - Migrated infrastructure to Rancher Desktop + Kubernetes (Sep 30, 2025)
  - Replaced Docker Desktop with Rancher Desktop (containerd + k3s + nerdctl)
  - Updated namespace from "brave-forms" to "braveforms"
  - Changed ports: 30001-30003 → 30101-30103
  - Added port conflict detection system
  - Updated all documentation and deployment scripts
  - Matches production EKS architecture
  - Added 18 slash commands for streamlined workflows
  - Added ABSOLUTE CODE STANDARDS (NO emoji, NO AI branding)
  - Expanded enforcement techniques with mandatory checklists
  - Added detailed git workflow standards and commit format
  - Added iOS storage persistence warning (IndexedDB transient)
  - Clarified EPA CGP "working hours" interpretation
  - Added session validation protocol
  - Expanded code standards with multi-tenancy and offline requirements

**Remember:** This platform prevents construction companies from facing $25,000-$50,000 daily EPA fines. Every feature must be field-tested and compliance-validated. Zero tolerance for compliance inaccuracy.

**Code Cleanliness:** Zero emoji, zero AI branding, zero decorative characters. Professional code only.