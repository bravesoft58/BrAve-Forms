---
allowed-tools: Bash(git:*)
argument-hint: <feature-name>
description: Create feature branch and initialize with proper structure
---

Create a new feature branch 'feature/$ARGUMENTS' following these steps:

1. Verify current branch is clean: git status
2. Ensure main/master is up to date: git fetch origin
3. Create and checkout new branch: git checkout -b feature/$ARGUMENTS
4. Confirm branch creation: git branch --show-current
5. Remind Developer to use TodoWrite for multi-step tasks

DO NOT create any files yet. Wait for feature requirements from Developer.