# CLAUDE.md

**Last Updated:** 2026-03-09T16:00:00Z
**Doc Version:** v0.2.0

## Project Overview

**BrAve Forms** — Construction compliance forms platform for Q&D Construction (Nevada). Next.js 16 + Supabase, offline-first, EPA/OSHA compliant.

## Memory System (Engram Flow)

This project is connected to **Engram Flow**, an AI agent memory engine. Memory tools are available via MCP and auto-detected for this project.

- **Tenant:** `melport`
- **Domain:** `brave-forms`

### Available Memory Tools

| Tool | Purpose | When to Use |
|------|---------|-------------|
| `memory_recall` | Search past decisions, facts, and context | Before answering non-trivial questions. Before making architectural decisions. |
| `memory_store` | Save a decision, fact, or insight | After any significant decision, discovery, or bug fix. |
| `memory_trace` | Inspect what memories were considered in a recall | When debugging retrieval quality or understanding why something was/wasn't recalled. |
| `behavior_search` | Search learned behaviors, skills, workflows | When looking for established patterns or project conventions. |
| `recent_learnings` | Latest high-confidence facts | At session start to bootstrap context. |

### Memory Usage Rules

1. **Session start**: Call `recent_learnings` to load context from previous sessions.
2. **Before decisions**: Call `memory_recall` to check what's already known.
3. **After decisions**: Call `memory_store` to persist the decision for future sessions.
4. **Don't duplicate**: Search before storing. Update existing knowledge rather than creating duplicates.

### Identity Parameters

All memory tools auto-detect `tenant_id` and `domain_id` from the project context. You do not need to pass them explicitly unless querying a different domain.

## Development Workflow

_Add your project-specific workflow instructions here._

## Commit Standards

Follow Conventional Commits:
```
type(scope): description
```
