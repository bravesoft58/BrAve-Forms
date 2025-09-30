---
allowed-tools: Bash(pnpm:*)
description: Run complete quality gate (lint, type-check, test, build)
---

Run the following commands in sequence and report results with file paths and line numbers for any failures:

1. pnpm lint
2. pnpm type-check
3. pnpm test
4. pnpm build

If ANY step fails, report the failure details and DO NOT proceed to next steps. All quality gates must pass before code can be committed.