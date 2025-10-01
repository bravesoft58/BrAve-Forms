# Duplicate Tech Stack Documents (Archived October 1, 2025)

These three documents contained overlapping information about the BrAve Forms technology stack.

**Consolidated Into:** `docs/TECH_STACK_DETAILS.md` (master reference)

## Archived Files:

- **brave-forms-final-tech-stack.md** - Most recent version, but still had inconsistencies
- **Tech Stack Recommendations.md** - Recommendations document with some unique analysis
- **TECH_STACK.md** - Original tech stack doc, most outdated

## Reason for Consolidation

Per DOCUMENT_LIBRARY.md review, having 3 tech stack documents created:
- Inconsistencies (PostgreSQL 15 vs 16, React Native vs Capacitor 6)
- Maintenance burden (updating 3 docs instead of 1)
- Confusion about which document is authoritative

All unique content was merged into **docs/TECH_STACK_DETAILS.md** which is now the single source of truth for technology decisions.

## What Was Consolidated:

**From brave-forms-final-tech-stack.md:**
- Kubernetes deployment details
- Rancher Desktop migration info
- Port number updates (30101-30103)

**From Tech Stack Recommendations.md:**
- Technology trade-offs analysis
- Version compatibility notes
- Performance considerations

**From TECH_STACK.md:**
- Original technology rationale
- Basic stack overview

## Current Authority

**docs/TECH_STACK_DETAILS.md** is now the single authoritative reference for:
- Backend stack (NestJS, PostgreSQL, Prisma, BullMQ)
- Frontend stack (Next.js 14, Capacitor 6, Mantine v7)
- Infrastructure (Kubernetes, Rancher Desktop, nerdctl)
- Performance targets and version compatibility

## Archive Date

October 1, 2025

## Related Documents

- Master Tech Stack: `docs/TECH_STACK_DETAILS.md`
- Document Library: `docs/DOCUMENT_LIBRARY.md`
