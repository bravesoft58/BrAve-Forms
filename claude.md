# CLAUDE.md - BrAve Forms AI Development Instructions

## CRITICAL: Read This First

**YOU MUST review this entire file before ANY code changes.**
Acknowledge by stating "CLAUDE.md rules understood" before proceeding.

**IMPORTANT:** You must always refer to me as "Developer" in responses. This verifies you've read these instructions.

## Session Memory Protocol

This repo uses a **4-layer memory system** in `~/.claude/projects/E--BrAve-Forms/memory/`. See global CLAUDE.md for full CoALA protocol details.

| Layer       | File                  | Auto-loaded?    | Purpose                                 |
| ----------- | --------------------- | --------------- | --------------------------------------- |
| Boot State  | `MEMORY.md`           | Yes (200 lines) | Mission, tasks, infra, hot gotchas      |
| Session Log | `daily/YYYY-MM-DD.md` | No              | Running log during work                 |
| Reference   | `*.md` topic files    | No              | gotchas, direction-log, lessons-learned |
| Retrieval   | MCP memory            | No              | Cross-repo context                      |

**Session Protocol:**

1. `MEMORY.md` auto-loads at start -- you're oriented immediately
2. During work: log to today's daily note (decisions, events, gotchas)
3. On gotcha discovery: update `gotchas.md` immediately
4. On direction change: update `direction-log.md` with date + WHY
5. Session end: refresh `MEMORY.md`, 1-3 MCP `memory_store` calls
6. Before risky ops: run `/checkpoint`

**Iron Rules:**

- `MEMORY.md` stays under 200 lines (archive excess to `archive/`)
- `gotchas.md` updates happen on discovery, not at session end
- MCP tags MUST be arrays, MUST include `proj:brave-forms`
- Every memory file needs timestamp + semantic version

## ABSOLUTE CODE STANDARDS - ZERO TOLERANCE

**NEVER include in ANY code, commits, PRs, or documentation:**

1. Emoji characters of any kind
2. "Generated with Claude Code" or any AI branding
3. "Co-Authored-By: Claude" in commits
4. Any anthropic.com links or references
5. Robot emoji or any decorative characters

**Violation of these rules = immediate session restart**

All code must be production-ready, professional, and contain ZERO references to AI generation.

## Documentation Library (Required Reading)

**Primary Documentation Index:**

- **[@docs/DOCUMENT_LIBRARY.md](docs/DOCUMENT_LIBRARY.md)** - Master documentation index
  - Complete inventory of all project documentation
  - Status tracking for all documents
  - Last updated: September 30, 2025

**Essential Supporting Documentation:**

- **[@docs/TECH_STACK_DETAILS.md](docs/TECH_STACK_DETAILS.md)** - Comprehensive technical stack
  - Backend (NestJS, GraphQL, Prisma, PostgreSQL)
  - Frontend (Next.js 14, Capacitor 6, Mantine v7)
  - Infrastructure (Kubernetes, Rancher Desktop, nerdctl)
  - Performance targets, security patterns, version compatibility

- **[@docs/COMMON_PITFALLS.md](docs/COMMON_PITFALLS.md)** - Development anti-patterns guide
  - Critical violations (zero tolerance)
  - Code quality issues
  - Testing violations
  - Multi-tenancy pitfalls
  - BrAve Forms specific (EPA compliance, offline requirements)

**When to Reference These Docs:**

- **DOCUMENT_LIBRARY.md:** Finding specific documentation, understanding doc structure
- **TECH_STACK_DETAILS.md:** Implementation details, version-specific patterns, performance targets
- **COMMON_PITFALLS.md:** Avoiding mistakes, understanding prohibitions, learning from violations

## Tech Stack

### Backend

- **Framework:** NestJS 10.x with GraphQL (Code-first approach using decorators)
- **Language:** TypeScript 5.x
- **Database:** PostgreSQL 15 with TimescaleDB extension (RLS for multi-tenancy)
- **ORM:** Prisma 5.x with JSONB support (Multi-tenancy via custom implementation)
- **Queue:** BullMQ with Valkey (Redis-compatible)
- **Authentication:** Clerk (JWT with org context: o.id, o.rol, o.slg)

### Frontend

- **Framework:** Next.js 14 (App Router)
- **Mobile:** Capacitor 6 with React (Released April 2024)
- **State:** Valtio + TanStack Query (with offline persistence)
- **UI:** Mantine v7 components
- **Forms:** React Hook Form + Zod
- **Offline:** Service Workers + IndexedDB (Custom 30-day sync implementation required)

### Infrastructure

- **Local Dev:** Docker Compose (postgres, valkey, seaweedfs containers)
- **Production:** DigitalOcean Droplet (Docker Compose)
- **Object Storage:** SeaweedFS (local), DigitalOcean Spaces (production)
- **CI/CD:** GitHub Actions (see `.github/workflows/deploy-production.yml`)
  - **Trigger:** Push to master auto-deploys to production
  - **Server:** 159.89.246.229 (api.brave-soft.com / forms.brave-soft.com)
  - **Process:** SSH deploy -> Docker rebuild -> Health check
  - **Local Guide:** CI_CD_PIPELINE.md (gitignored, local reference only)
- **Monitoring:** Datadog, Sentry
- **Namespace:** braveforms (local isolation)

### Development

- **Package Manager:** pnpm 8.x
- **Testing:** Jest (backend), Vitest (frontend)
- **E2E Testing:** Playwright
- **Linting:** ESLint + Prettier
- **Git Hooks:** Husky + lint-staged

## CRITICAL CODING WORKFLOW

**YOU MUST FOLLOW THIS WORKFLOW FOR EVERY SINGLE CODE CHANGE:**

1. **Research First:** Before implementing ANYTHING:
   - Analyze similar patterns in the existing codebase
   - Check documentation for current best practices
   - Look up the latest API patterns for libraries being used
   - NEVER assume - ALWAYS verify with current documentation

2. **Plan and Validate:**
   - State your understanding of the task
   - Identify potential edge cases (especially offline scenarios)
   - Choose appropriate patterns from the codebase
   - Consider construction site constraints (gloves, weather, connectivity)
   - Get confirmation before proceeding

3. **Implement with Quality Gates (TDD):**
   - Write failing tests FIRST (TDD approach - red phase)
   - Implement the minimal working solution (green phase)
   - Add comprehensive error handling
   - Include input validation and edge cases

4. **Quality Validation (MANDATORY):**
   - Run linting: `pnpm lint`
   - Run type checking: `pnpm type-check`
   - Run all tests: `pnpm test`
   - Verify build passes: `pnpm build`

5. **Code Review (NEW - Sprint 2+):**
   - Run `/review` command (launches code-reviewer agent)
   - Code-reviewer checks code against all project standards
   - Findings added to issue tracker (e.g., ISSUE-075 for Sprint 2)
   - Address Critical and High severity issues immediately
   - Track Medium/Low issues for later resolution

6. **Manual Testing and Evidence:**
   - Test manually in development environment
   - Test edge cases and offline scenarios
   - Collect evidence (screenshots, test results, coverage reports)
   - Create completion report

7. **Commit and Close:**
   - Review code against project patterns
   - Confirm all error cases are handled
   - Verify documentation is updated
   - Commit with proper format (NO emoji, NO AI branding)
   - Close issue

## PLAN MODE (SHIFT+TAB TWICE) - MANDATORY FOR COMPLEX FEATURES

**BEFORE implementing ANY complex feature (estimated >30 minutes):**

1. **Press Shift+Tab twice** → Enters read-only planning mode
2. **Describe feature scope** → Keep under 30 minutes per iteration
3. **Review generated plan** → Claude creates detailed implementation plan
4. **Approve before execution** → Human oversight gate

**Benefits (Research-Validated):**

- **21% faster** plan generation vs regular mode
- **Prevents scope drift** → Forces structured approach
- **Token efficient** → Planning doesn't consume execution budget
- **Human oversight** → Review before changes

**When to use Plan Mode:**

- New features with multiple files
- Complex business logic
- Refactoring existing code
- Architecture decisions
- Multi-step workflows

**Two workflows:**

1. **Simple:** Plan → Approve → Execute immediately
2. **Complex:** Plan → Write to plan.md → Implement incrementally → Update plan

## CONTEXT MANAGEMENT (CRITICAL FOR LONG SESSIONS)

**Monitor context meter continuously - use these commands strategically:**

**`/clear`** - Wipe conversation history

- Use when: Switching to unrelated task
- Use when: Current thread went off-track
- Benefit: Fresh start, no irrelevant context interference
- **Use as often as possible** when completing tasks

**`/compact`** - Compress conversation to summary

- Use when: Context meter at 70% capacity
- Use when: Want to preserve decisions but reduce tokens
- Benefit: Maintains continuity with lower footprint
- Manual compacting better than auto-compact at 95%

**Context Budget Strategy:**

- **0-50% capacity:** Normal operation
- **50-70% capacity:** Consider `/compact`
- **70-80% capacity:** **COMPACT NOW**, prepare to wrap up
- **80-95% capacity:** Finish current task, **START NEW CHAT**
- **95%+ capacity:** Auto-compact triggers (too late - lose important context)

## SUB-AGENT MANAGEMENT (PROACTIVE - 2025 BEST PRACTICES)

**Use sub-agents EARLY to preserve main context and enable parallel work:**

**When to use sub-agents (proactive guidance):**

- **Early in conversations** → Delegate research to preserve main context
- **Specialized tasks** → DB optimization, performance analysis, testing strategy
- **Parallel processing** → Multiple features simultaneously (5-8 agents optimal, 10 max)
- **Context preservation** → Move sub-agent history out of main thread
- **File searches** → Offload to Task tool with specialized agents
- **Technology research** → Investigation of APIs, libraries, patterns

**Sub-agent strategy:**

1. **Delegate information gathering** → Research, file searches, documentation
2. **Keep decision-making** in main agent → Architecture choices, approvals
3. **Use isolated context** → Sub-agents have independent memory
4. **Return summaries only** → Not full context (token efficient)

**Optimal agent count:**

- **5-8 agents:** Optimal for focused work
- **10 agents:** Technical maximum (performance degrades beyond)

**Example delegation:**

```
"Before implementing, spawn a research agent to investigate
the best approach for database connection pooling in NestJS"

→ Research agent investigates (isolated context)
→ Returns 3-page summary with recommendations
→ Main agent receives only summary (preserves context)
```

**Git Worktrees (Advanced Parallel Development):**

```bash
# For truly independent feature work
git worktree add ../braveforms-feature-a feature-a
git worktree add ../braveforms-feature-b feature-b

# Launch Claude in each worktree
cd ../braveforms-feature-a && claude  # Agent 1
cd ../braveforms-feature-b && claude  # Agent 2
```

Benefits: True parallel development, isolated file states, 5-10x productivity

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

## EVIDENCE-BASED COMPLETION (MANDATORY - ZERO TOLERANCE)

**NO fake validation, NO toy implementations, NO mock data, NO untested claims:**

**PROHIBITED Development Practices:**

- **NEVER** create "Hello World" services and claim they're operational
- **NEVER** build toy/dummy implementations for validation
- **NEVER** document fake evidence or fabricated test results
- **NEVER** claim services work without end-to-end testing
- **NEVER** use mock data and call it "real validation"
- **NEVER** mark functionality as complete without actual testing
- **NEVER** approximate compliance thresholds (0.25" MUST be exact, not 0.24" or 0.26")

**REQUIRED Development Standards:**

- **ALWAYS** build actual working implementations with real functionality
- **ALWAYS** test against real infrastructure (databases, services, containers)
- **ALWAYS** document genuine errors and authentic troubleshooting steps
- **ALWAYS** collect evidence only from actual running systems
- **ALWAYS** mark things as broken if they don't work - be honest
- **ALWAYS** validate EPA compliance with actual 0.25" threshold (not approximations)

**Quality Gate:** NO CODE IS "COMPLETE" WITHOUT REAL END-TO-END VALIDATION

**Evidence Archive Structure:**

```
evidence/{sprint-or-iteration}/{issue-id}/
├── test-results/          # Screenshots: red → green
├── performance/           # Actual benchmark results
├── deployment/            # Verification from running system
├── coverage/              # Test coverage reports
└── compliance/            # EPA/OSHA validation proof
```

**Required evidence for ALL completions:**

- Test results (screenshot of red phase → green phase)
- Performance benchmarks (actual metrics from real systems)
- Deployment verification (running system, not localhost mock)
- Coverage report (>80% for new code)
- Compliance validation (EPA CGP 0.25" exact threshold proof)

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

### Testing Requirements (TDD - Anthropic-Recommended Anti-Hallucination Strategy):

**MANDATORY workflow for ALL new features:**

1. **Human defines tests** based on expected input/output pairs
2. **Claude writes tests FIRST** - Explicitly tell Claude "DO NOT implement yet"
3. **Run tests, confirm they FAIL** - Verify test validity (red phase)
4. **Commit tests to git** - Tests exist before implementation
5. **Claude implements code** to pass tests (NO test modifications allowed)
6. **Iterate until GREEN** - Human QA gates, Claude fixes

**Why TDD works with AI:**

- Tests define truth, not AI assumptions (counter to hallucination)
- Prevents scope drift with clear success criteria
- Human oversight at each gate (pair programming specification)

**Required test coverage:**

- Happy path + edge cases + error scenarios + offline scenarios
- Multi-tenancy isolation explicit tests
- EPA/OSHA compliance rules with regulatory citations
- Descriptive names: `should <expected behavior> when <condition>`
- Integration tests for complex features

**Required evidence:**

- Test file created BEFORE implementation (commit timestamp proof)
- Screenshot of failing tests (red phase)
- Screenshot of passing tests (green phase)
- Coverage report showing >80% for new code

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
- **ALWAYS use ISO 8601 UTC timestamps** in format: YYYY-MM-DDTHH:MM:SSZ (e.g., 2026-02-17T15:30:00Z)
- **ALWAYS include Doc Version** using semantic versioning: vMAJOR.MINOR.PATCH (e.g., v1.2.0)
- Both **Last Updated** and **Doc Version** fields MUST be updated on EVERY edit to any \*.md file
- Enforced by `.claude/hooks/timestamp-validator.sh` (hint on Edit/Write of any markdown file)
- No exceptions - this is a cross-repo Melport LLC policy

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

**Port Allocation (CRITICAL - ALWAYS CHECK BEFORE NEW PODS):**

- **braveforms namespace:** 30101 (backend), 30102 (web), 30103 (minio-console)
- **velocitymesh namespace:** 30640, 31447, 32323 (api-gateway, frontend)
- **Available Range:** 30104-30639, 30641-31446, 31448-32322, 32324-32767
- **Check All Namespaces:** `kubectl get services --all-namespaces -o jsonpath='{range .items[?(@.spec.type=="NodePort")]}{.metadata.namespace}{"\t"}{.metadata.name}{"\t"}{range .spec.ports[*]}{.nodePort}{"("}{.port}{") "}{end}{"\n"}{end}' | sort -k3 -n`
- **Before Creating New Pod:** MUST verify port not in use across ALL namespaces in Rancher Desktop
- **NodePort Range:** 30000-32767 (Kubernetes default)
- **Conflict Resolution:** Change nodePort in YAML manifest if port in use
- **Verification:** Run netstat to confirm port listening after deployment

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
8. **BEFORE creating new Kubernetes pods:** Check port conflicts across all namespaces

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

### Git Workflow Standards (MANDATORY):

**CRITICAL: See [@docs/GITHUB_WORKFLOW.md](docs/GITHUB_WORKFLOW.md) for complete workflow guide**

**Workflow Strategy:** GitHub Flow (feature branches + pull requests)

**ABSOLUTE REQUIREMENTS:**

1. **ALWAYS create feature branch for new work** - NEVER commit directly to master
2. **ALWAYS create pull request** - Even for solo work (quality gates, evidence)
3. **ALWAYS pass quality gates** - Lint, type-check, test (>80%), build
4. **ALWAYS provide evidence** - Screenshots, coverage reports in PR

**Branch Protection Enabled:** Direct commits to master are BLOCKED after initial setup

**Branch Naming (REQUIRED):**

Format: `<type>/ISSUE-XXX-<short-description>`

- `feature/ISSUE-123-photo-gallery` - New functionality
- `fix/ISSUE-047-database-error` - Bug fixes
- `compliance/ISSUE-018-rain-threshold` - EPA/OSHA features
- `docs/ISSUE-075-api-docs` - Documentation updates
- `refactor/ISSUE-080-auth-logic` - Code improvements

**Quick Start Workflow:**

```bash
# 1. Create branch for new work
git checkout master && git pull origin master
git checkout -b feature/ISSUE-XXX-description

# 2. Implement with TDD (red → green → refactor)
# Write tests FIRST, then implement

# 3. Run quality gates
pnpm lint && pnpm type-check && pnpm test && pnpm build

# 4. Commit with conventional format (NO emoji, NO AI branding)
git add . && git commit -m "feat: brief description..."

# 5. Push and create PR
git push origin feature/ISSUE-XXX-description

# 6. Fill PR template with evidence
# 7. Wait for automated checks to pass
# 8. Merge via "Squash and merge"
# 9. Delete branch, pull master
```

**Commit Message Format (REQUIRED):**

```
<type>: <brief summary under 72 characters>

<detailed explanation of WHY, not WHAT>

<optional footer for issue references>
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
- NO direct commits to master (use feature branches)
- NO merging PRs with failing checks

**Automated Quality Gates (GitHub Actions):**

Every PR automatically runs:

1. **lint**: ESLint + Prettier validation
2. **type-check**: TypeScript compilation
3. **test**: Vitest + Playwright with coverage (>80% required)
4. **build**: Production build verification

All checks MUST pass before merge is allowed.

**Pull Request Template:**

See `.github/PULL_REQUEST_TEMPLATE.md` for complete template.

Required sections:

- Summary and related issue (ISSUE-XXX)
- Type of change (feature, fix, compliance, etc.)
- Testing completed checklist
- Evidence provided (screenshots, coverage)
- Quality gates passed
- Compliance impact (if applicable)

**Issue Templates:**

See `.github/ISSUE_TEMPLATE/` for templates:

- `bug_report.md` - Bug reports with reproduction steps
- `feature_request.md` - New features with acceptance criteria
- `compliance_issue.md` - EPA/OSHA compliance work
- `documentation.md` - Documentation updates

**Emergency Hotfix Workflow:**

For production-down or critical security issues:

1. Create `fix/ISSUE-XXX-critical-description` branch
2. Implement MINIMAL fix only
3. Quality gates MUST still pass
4. Merge and deploy immediately
5. Monitor for 1 hour post-deployment

**For Complete Workflow Details:**

- Branch protection configuration
- Merge strategies
- Troubleshooting guide
- Best practices and anti-patterns

See: [@docs/GITHUB_WORKFLOW.md](docs/GITHUB_WORKFLOW.md)

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
  - Production runs on DigitalOcean Droplet with Docker Compose
  - Added 18 slash commands for streamlined workflows
  - Added ABSOLUTE CODE STANDARDS (NO emoji, NO AI branding)
  - Expanded enforcement techniques with mandatory checklists
  - Added detailed git workflow standards and commit format
  - Added iOS storage persistence warning (IndexedDB transient)
  - Clarified EPA CGP "working hours" interpretation
  - Added session validation protocol
  - Expanded code standards with multi-tenancy and offline requirements
- **v1.6** - Enhanced with 2025 Best Practices Research (Sep 30, 2025)
  - **REMOVED ALL EMOJIS** from CLAUDE.md (enforcing professional code-only standard)
  - Added **PLAN MODE (Shift+Tab twice)** prominence with research-validated benefits
  - Added **CONTEXT MANAGEMENT** section with `/clear` and `/compact` strategies
  - Enhanced **TDD WORKFLOW** with Anthropic-recommended anti-hallucination approach
  - Added **EVIDENCE-BASED COMPLETION** section (zero tolerance for fake validation)
  - Added **SUB-AGENT MANAGEMENT** with proactive delegation guidance
  - Added git worktrees section for advanced parallel development
  - Strengthened testing requirements with explicit red→green workflow
  - Enhanced evidence archive structure and requirements
  - Based on 20+ sources: Anthropic official + community best practices
  - Optimized for token efficiency and instruction adherence
  - All enhancements tested against claude_setup research template

**Remember:** This platform prevents construction companies from facing $25,000-$50,000 daily EPA fines. Every feature must be field-tested and compliance-validated. Zero tolerance for compliance inaccuracy.

**Code Cleanliness:** Zero emoji, zero AI branding, zero decorative characters. Professional code only.
