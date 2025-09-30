---
allowed-tools: Bash(git:*), Bash(pnpm:*), Bash(gh:*)
description: Verify branch is ready for PR and create it (NO branding)
---

Verify branch is PR-ready and create pull request:

1. Run full quality gate: pnpm lint && pnpm type-check && pnpm test && pnpm build
2. If feature touches offline/mobile: pnpm test:offline
3. If feature touches EPA/OSHA: pnpm test:compliance
4. Review all commits for clean messages: git log --oneline origin/master..HEAD
5. Scan commits for violations: git log --format=%B | grep -E "(:[a-z_]+:|Generated with|claude\.com|Co-Authored)"
6. If violations found: STOP and report them
7. Generate PR description from commits
8. Create PR: gh pr create --title "..." --body "..."

PR Description Template:
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
- [ ] Compliance validated (if applicable)

## Breaking Changes
None / List if applicable
```

NO emoji, NO AI branding in PR title or description.