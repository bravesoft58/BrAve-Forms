---
description: Launch doc-sync-guardian to update all documentation
---

Launch doc-sync-guardian agent to synchronize documentation with code changes:

1. Find all documentation files affected by recent code changes
2. Identify API documentation needing updates (GraphQL schema changes)
3. Check if README needs updates (public interfaces, setup instructions)
4. Review CLAUDE.md for new patterns to document
5. Scan all documentation for emoji and remove
6. Scan all documentation for AI branding ("Generated with Claude Code") and remove
7. Verify code examples in docs are current and working

Report all documentation updates made with file paths.

Use doc-sync-guardian agent for comprehensive documentation synchronization.