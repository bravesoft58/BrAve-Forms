---
name: Compliance Issue
about: EPA/OSHA regulatory compliance work
title: '[COMPLIANCE] '
labels: compliance, regulatory
assignees: ''
---

## Compliance Requirement

A clear description of the EPA or OSHA requirement that needs to be addressed.

## Regulatory Reference

- **Regulation:** EPA CGP 2022 / OSHA 1926.XXX / Other
- **Section:** Section X.X
- **Document Link:** (if available)
- **Effective Date:** (if applicable)

## Current State

Describe the current implementation (or lack thereof).

## Required Changes

Describe what needs to be implemented or changed to meet compliance.

## Compliance Validation

### Testing Requirements

- [ ] Exact threshold validation (e.g., 0.25" rain, not approximate)
- [ ] Timing requirements validated (e.g., 24-hour working hours window)
- [ ] Multi-tenant isolation verified
- [ ] Audit trail created
- [ ] Inspector access tested (if applicable)

### Evidence Requirements

- [ ] Regulatory citation documented
- [ ] Test results showing compliance
- [ ] Screenshots of compliance features
- [ ] Audit trail examples

### Offline Requirements

- [ ] Must work offline for 30 days
- [ ] Sync compliance data when online
- [ ] Queue inspections when offline

## Penalty for Non-Compliance

**Severity:** (e.g., $25,000-$50,000 per day for EPA CGP violations)

## User Story

As a [compliance officer / field inspector / site manager],
I need [compliance feature],
So that [avoid penalties / meet regulatory requirements / pass inspections].

## Acceptance Criteria

- [ ] Exact regulatory threshold implemented (no approximations)
- [ ] Timing requirements met (working hours, deadlines)
- [ ] Audit trail captured (who, what, when, where)
- [ ] Inspector access provided (if required)
- [ ] Multi-tenant data isolation maintained
- [ ] Offline capability preserved
- [ ] Tests written with regulatory citations
- [ ] Documentation updated with compliance references

## Technical Implementation

### Frontend Changes

- List UI components, forms, or pages needed

### Backend Changes

- List API endpoints, database schema, or business logic needed

### Database Schema

- [ ] No schema changes
- [ ] Schema changes required (describe below)

**Schema Changes:** (if applicable)

### Background Jobs

- [ ] No background jobs needed
- [ ] Weather monitoring job (if rain-related)
- [ ] Scheduled inspection job
- [ ] Notification job

## Forms Affected

List any EPA/OSHA forms that need to be created or updated:

- Form 1: EPA CGP Daily Inspection
- Form 2: Rain Event Documentation
- Form 3: etc.

## Inspection Workflow

Describe how inspections are triggered, conducted, and documented:

1. Trigger event (e.g., rain >0.25")
2. Inspection scheduled within 24 working hours
3. Inspector completes form with GPS, photos, timestamps
4. Audit trail recorded
5. Report generated with regulatory citations

## Weather API Integration (if applicable)

- [ ] NOAA API integration required
- [ ] OpenWeatherMap fallback required
- [ ] Exact precipitation threshold: **\_** inches
- [ ] Rolling window: **\_** hours

## Priority

- [ ] P0 - Critical (immediate compliance risk, high penalty)
- [ ] P1 - High (required for launch, regulatory deadline)
- [ ] P2 - Medium (nice to have, improves compliance)

## Sprint Assignment

Suggested sprint: Sprint X

## Additional Context

Add any other context, regulatory guidance, or examples here.

## Compliance Checklist Before Closing

- [ ] Regulatory citation documented in code comments
- [ ] Exact thresholds validated (no approximations)
- [ ] Timing requirements tested (working hours logic)
- [ ] Audit trail captured (immutable logs)
- [ ] Multi-tenant isolation verified
- [ ] Offline capability maintained
- [ ] Inspector access tested (QR codes work)
- [ ] Evidence collected (screenshots, test results, coverage)
- [ ] Documentation updated with regulatory references
