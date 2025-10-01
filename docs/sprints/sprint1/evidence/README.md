# Sprint 1 Evidence Collection

## Purpose

This folder contains **actual evidence** of completed work for Sprint 1 issues. Following CLAUDE.md principles:

**NO fake validation, NO toy implementations, NO mock data**

## Evidence Requirements

Every issue MUST collect real evidence:

### Required Evidence Types

1. **test-results/** - Screenshots showing:
   - Red phase (tests failing before implementation)
   - Green phase (tests passing after implementation)
   - Coverage reports

2. **performance/** - Actual metrics:
   - API response times
   - Bundle sizes
   - Database query performance
   - Cache hit rates

3. **deployment/** - Running system proof:
   - Screenshots from actual running services
   - Command outputs from real infrastructure
   - Integration test results from live environment

4. **compliance/** - EPA/OSHA validation (when applicable):
   - 0.25" threshold accuracy proof
   - 24-hour calculation validation
   - Regulatory citation documentation

## Evidence Folder Structure

```
evidence/
├── ISSUE-001/          # PostgreSQL verification
│   ├── deployment/
│   │   ├── psql-version.png
│   │   ├── database-connection.png
│   │   └── tables-list.png
│   └── README.md
├── ISSUE-002/          # Redis verification
│   ├── deployment/
│   │   ├── redis-version.png
│   │   ├── redis-ping.png
│   │   └── basic-commands.png
│   └── README.md
├── ISSUE-003/          # Prisma migration
│   ├── deployment/
│   │   ├── prisma-generate.png
│   │   ├── migrations-applied.png
│   │   ├── tables-created.png
│   │   └── prisma-studio.png
│   └── README.md
...
```

## How to Collect Evidence

### 1. Take Screenshots During Work

As you complete each step, take screenshots:

**Windows:** Win + Shift + S
**Mac:** Cmd + Shift + 4
**Linux:** Screenshot tool

### 2. Name Files Descriptively

Good: `psql-version-15.4.png`
Bad: `screenshot1.png`

### 3. Create Issue-Specific README

Each ISSUE-###/README.md should contain:

- What was done
- Evidence files explanation
- Any issues encountered
- Date completed

### 4. Commit Evidence with Issue

```bash
git add docs/sprints/sprint1/evidence/ISSUE-###/
git commit -m "Add evidence for ISSUE-###: [issue title]

Evidence includes:
- [file1.png]: [what it shows]
- [file2.png]: [what it shows]"
```

## Evidence Templates

### Infrastructure Issue Template

See: `evidence/ISSUE-001/README.md` for example

Should include:

- Service version screenshot
- Connection test screenshot
- Configuration verification

### Code Implementation Template

Should include:

- Test failing (red phase)
- Test passing (green phase)
- Code coverage report
- Running feature screenshot

### API Integration Template

Should include:

- Actual API response (JSON)
- Performance metrics
- Error handling test
- Caching verification

## Quality Standards

Evidence MUST be:

- **Real:** From actual running systems, not mocked
- **Timestamped:** Recent, provably from this sprint
- **Clear:** High quality, readable screenshots
- **Complete:** All acceptance criteria verified

## Prohibited

- Fake screenshots or doctored images
- Mock data presented as real
- "Hello World" implementations as evidence
- Unverified claims without proof

## Review Checklist

Before marking issue complete:

- [ ] All required evidence collected
- [ ] README.md created in issue folder
- [ ] Files named descriptively
- [ ] Evidence proves acceptance criteria met
- [ ] No fake/mock evidence

---

**Remember:** This platform prevents $25,000-$50,000 daily EPA fines. Evidence must be **real and verifiable**.
