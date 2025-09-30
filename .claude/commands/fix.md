---
allowed-tools: Bash(git:*), Read, Grep
argument-hint: <issue-number>
description: Create fix branch and investigate issue
---

Create bugfix branch 'fix/$ARGUMENTS' and investigate the issue:

1. Create and checkout branch: git checkout -b fix/$ARGUMENTS
2. Search codebase for related code patterns
3. Check git log for similar past fixes
4. Review existing tests for the affected area
5. Identify root cause area with file paths

Present investigation findings to Developer before proposing solution. Use TodoWrite to track fix steps.