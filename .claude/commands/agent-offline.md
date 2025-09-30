---
description: Launch offline-sync-specialist for offline sync issues
---

Launch offline-sync-specialist agent to analyze and resolve offline sync issues:

Focus areas:
- Service Worker configuration and caching strategies
- IndexedDB schema and operations
- Delta sync with conflict resolution
- 30-day offline data retention
- Sync queue processing with BullMQ
- iOS storage persistence (IndexedDB transient - recommend SQLite for critical data)
- Network status detection and automatic sync triggers
- Offline UI indicators and user experience

The agent will:
1. Analyze current offline implementation
2. Identify issues or gaps
3. Propose solutions following Service Worker + IndexedDB patterns
4. Warn about iOS storage limitations
5. Provide implementation plan

Report findings with file paths and implementation recommendations.