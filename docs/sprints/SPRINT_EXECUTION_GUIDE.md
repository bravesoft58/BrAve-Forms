# BrAve Forms Sprint Execution Guide

## 📋 Sprint Planning Checklist

### Pre-Sprint Planning (Thursday before sprint)
- [ ] Review previous sprint metrics
- [ ] Groom backlog with Product Owner
- [ ] Identify dependencies and risks
- [ ] Check team capacity and availability
- [ ] Prepare sprint goal statement
- [ ] Update story point estimates

### Sprint Planning Meeting (Day 1, 4 hours)
**Part 1: What (2 hours)**
- [ ] Review sprint goal
- [ ] Present user stories
- [ ] Clarify acceptance criteria
- [ ] Identify dependencies
- [ ] Commit to sprint backlog

**Part 2: How (2 hours)**
- [ ] Break down stories into tasks
- [ ] Estimate task hours
- [ ] Identify technical approach
- [ ] Assign initial owners
- [ ] Update sprint board

## 🏃 Daily Execution Framework

### Daily Standup (9:15 AM, 15 minutes)
**Format:**
1. What did I complete yesterday?
2. What will I work on today?
3. What blockers do I have?

**Rules:**
- Strictly 15 minutes
- Blockers discussed after standup
- Update sprint board before standup
- No problem-solving during standup

### Daily Practices
- **Morning:** Pull latest code, review PRs
- **Coding:** Follow TDD approach
- **Afternoon:** Push code, update tickets
- **End of Day:** Update remaining hours

## 🔍 Quality Gates

### Code Review Requirements
```yaml
Required Reviewers: 2
- At least 1 senior developer
- Cannot be the author

Checklist:
- [ ] Tests included and passing
- [ ] Follows project patterns
- [ ] No security vulnerabilities
- [ ] Performance impact assessed
- [ ] Documentation updated
```

### Definition of Done
**Story Level:**
- [ ] Code complete and reviewed
- [ ] Unit tests written (>80% coverage)
- [ ] Integration tests passing
- [ ] Deployed to staging
- [ ] Acceptance criteria met
- [ ] Documentation updated
- [ ] No critical bugs

**Sprint Level:**
- [ ] All committed stories complete
- [ ] Sprint goal achieved
- [ ] Regression tests passing
- [ ] Performance benchmarks met
- [ ] Stakeholder demo completed
- [ ] Retrospective conducted

## 📊 Velocity Tracking

### Metrics to Monitor
| Metric | Target | Yellow | Red |
|--------|--------|--------|-----|
| Velocity | 40 pts | 35 pts | <30 pts |
| Completion Rate | 95% | 85% | <75% |
| Bug Escape Rate | <5% | 10% | >15% |
| Test Coverage | >80% | 75% | <70% |

### Velocity Calculation
```
Velocity = Completed Story Points / Sprint
Rolling Average = Last 3 Sprints Average
Capacity = Team Members × Days × Focus Factor (0.7)
```

## 🚨 Risk Management

### Daily Risk Assessment
- **Technical Risks:** Architecture decisions, integrations
- **Resource Risks:** Availability, skills gaps
- **External Risks:** API dependencies, compliance changes
- **Quality Risks:** Test coverage, technical debt

### Escalation Triggers
1. **Velocity <75% by mid-sprint:** Alert Scrum Master
2. **Critical bug found:** Immediate triage meeting
3. **Dependency blocked:** Escalate within 4 hours
4. **Team member unavailable:** Redistribute within day

## 🔄 Sprint Ceremonies

### Mid-Sprint Check-in (Wednesday, Week 1)
- Review burndown chart
- Assess sprint goal progress
- Identify risks to completion
- Adjust if necessary

### Sprint Review (Friday, Week 2, 2 PM)
**Agenda (2 hours):**
1. Sprint goal recap (5 min)
2. Velocity and metrics (10 min)
3. Demo completed features (60 min)
4. Stakeholder feedback (30 min)
5. Next sprint preview (15 min)

### Sprint Retrospective (Friday, Week 2, 4 PM)
**Format (1.5 hours):**
1. Set the stage (10 min)
2. Gather data (20 min)
3. Generate insights (30 min)
4. Decide what to do (20 min)
5. Close retrospective (10 min)

**Techniques:**
- Sprint 1-3: Start, Stop, Continue
- Sprint 4-6: 4 Ls (Liked, Learned, Lacked, Longed for)
- Sprint 7-10: Sailboat (Wind, Anchors, Rocks, Island)

## 🏗️ Technical Practices

### Branching Strategy
```
main (production)
  ├── develop (staging)
      ├── feature/SPRINT-X-story-name
      ├── bugfix/SPRINT-X-issue
      └── hotfix/critical-issue
```

### Commit Message Format
```
type(scope): subject

Body (optional)

Refs: #ticket-number
```

Types: feat, fix, docs, style, refactor, test, chore

### Testing Requirements
**Unit Tests:** Every new function/component
**Integration Tests:** API endpoints, critical paths
**E2E Tests:** User journeys (Sprint 4+)
**Field Tests:** Mobile features (Sprint 3+)

## 📱 Field Testing Protocol

### Pre-Field Testing
- [ ] Create test scenarios
- [ ] Prepare test devices
- [ ] Brief test participants
- [ ] Set up data collection

### During Field Testing
- [ ] Follow test scripts
- [ ] Document issues immediately
- [ ] Capture screenshots/videos
- [ ] Note environmental conditions

### Post-Field Testing
- [ ] Compile feedback report
- [ ] Prioritize issues found
- [ ] Create bug tickets
- [ ] Schedule fixes

## 🎯 Sprint Goals Quick Reference (V2 - Web-First Strategy)

| Sprint | Primary Goal | Success Metric |
|--------|-------------|----------------|
| 1 | Foundation | Weather API working |
| 2 | Compliance | EPA rules accurate |
| 3 | Web UI Foundation | Admin dashboard live |
| 4 | Web Forms | Form builder complete |
| 5 | Web Features | QR portal live |
| 6 | Web MVP Launch | Beta customers onboarded |
| 7 | Mobile Foundation | Offline architecture ready |
| 8 | Mobile Features | Camera/GPS integrated |
| 9 | Mobile Sync | 30-day offline works |
| 10 | Polish | Full platform ready |

## 💡 Best Practices

### Communication
- Over-communicate in remote settings
- Document decisions in writing
- Use video for complex discussions
- Keep stakeholders informed weekly

### Code Quality
- Write tests first (TDD)
- Refactor continuously
- Review code thoroughly
- Monitor technical debt

### Team Health
- Respect work-life balance
- Celebrate achievements
- Address conflicts quickly
- Maintain sustainable pace

## 🚀 Continuous Improvement

### Sprint-over-Sprint Improvements
- Track action items from retrospectives
- Measure improvement impact
- Adjust processes based on data
- Share learnings across team

### Knowledge Sharing
- Pair programming for complex features
- Tech talks for new patterns
- Documentation for decisions
- Runbooks for operations

---

**Remember:** The sprint execution guide is a living document. Update it based on team feedback and lessons learned.

**Key Success Factors:**
1. Clear communication
2. Consistent execution
3. Continuous improvement
4. Customer focus
5. Compliance accuracy

*"Move fast with stable infrastructure" - Focus on quality while maintaining velocity*