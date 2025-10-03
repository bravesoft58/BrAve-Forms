# BrAve Forms - Session Synchronization Command

Perform a comprehensive project synchronization at session start:

## 1. Read Mandatory Documentation

**Critical (MUST READ FIRST):**

- `CLAUDE.md` (root) - AI development instructions v1.6
- `README.md` (root) - Project overview
- `docs/DOCUMENT_LIBRARY.md` - Master documentation index
- `docs/TECH_STACK_DETAILS.md` - Comprehensive tech stack
- `docs/COMMON_PITFALLS.md` - Development anti-patterns

## 2. Check Current Sprint Status

**Sprint Documentation:**

- `docs/sprints/SPRINT_1_COMPLETION_REPORT.md` - Sprint 1 status
- `docs/sprints/SPRINT_2_KICKOFF.md` - Sprint 2 planning
- `docs/sprints/sprint1/SPRINT_1_STATUS_REPORT.md` - Detailed progress

**Active Issues:**

- Look for `docs/sprints/sprint1/issues/ISSUE-*.md` files
- Check `docs/sprints/sprint1/evidence/` for completion status

## 3. System Health Checks (Rancher Desktop + k3s)

**Kubernetes Cluster:**

```bash
kubectl get nodes
kubectl get pods -n braveforms
kubectl get services -n braveforms
```

**Container Runtime:**

```bash
nerdctl --namespace k8s.io images | grep braveforms
```

## 4. Review Git Status

```bash
git status
git log -5 --oneline
git branch -a
```

## 5. Verify Development Environment

**Infrastructure Services:**

- Backend GraphQL: http://localhost:30101/graphql
- Web Frontend: http://localhost:30102
- MinIO Console: http://localhost:30103
- PostgreSQL: Port-forward 5432 if needed

**Check Database:**

```bash
kubectl port-forward svc/postgres 5432:5432 -n braveforms &
# Then verify connection
```

## 6. Summarize Findings

Provide concise summary including:

- Current sprint and phase
- Infrastructure health (pod status)
- Recent commits and changes
- Open issues requiring attention
- Next recommended actions

## Important Notes

- **ALWAYS** acknowledge CLAUDE.md rules understood
- **ALWAYS** address user as "Developer"
- Follow ZERO TOLERANCE standards (NO emoji, NO AI branding)
- Report actual status, not aspirational
- Be realistic about completion percentages
