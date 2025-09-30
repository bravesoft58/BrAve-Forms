---
allowed-tools: Bash(git:*), Bash(pnpm:*)
description: Commit changes after quality gates pass (NO branding)
---

Commit changes following strict quality gates:

1. Run quality gates: pnpm lint && pnpm type-check && pnpm test
2. Review staged changes: git diff --cached
3. Scan for violations: Check for emoji or "Generated with" or "claude.com" in diff
4. If violations found: STOP and report them to Developer
5. Create commit with conventional commit format (feat/fix/refactor/docs/test/compliance/perf/chore)

Commit message format:
```
<type>: <brief summary under 72 characters>

<detailed explanation of WHY, not WHAT>
```

ABSOLUTE RULES:
- NO emoji anywhere
- NO "Generated with Claude Code" or AI branding
- NO "Co-Authored-By: Claude" lines
- NO anthropic.com links