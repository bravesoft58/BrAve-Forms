---
allowed-tools: Bash(pnpm:*), Read, Grep
description: Test offline functionality and 30-day sync capabilities
---

Run offline-specific tests and verify the following:

1. Execute: pnpm test:offline
2. Check Service Worker registration in mobile app
3. Verify IndexedDB persistence configuration
4. Validate delta sync functionality
5. Check for iOS storage warnings (IndexedDB transient on iOS)

Report any offline failures with reproduction steps. Remind if critical data should use SQLite instead of IndexedDB for iOS persistence.