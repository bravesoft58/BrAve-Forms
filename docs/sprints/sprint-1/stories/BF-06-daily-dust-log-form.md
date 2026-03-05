# BF-06: Daily Dust Log Form (Editable)

**Sprint:** Sprint 1 - Foundation + First Form
**Story Points:** 5
**Priority:** HIGH
**Dependencies:** BF-01, BF-05
**Status:** NOT STARTED
**Created:** 2026-03-05
**Last Updated:** 2026-03-05T00:00:00Z
**Backlog Ref:** Andy Salvage Plan Section 5.1 (Form 1: Daily Dust Log), Salvage Sprint S2-005

---

## Summary

Build the Daily Dust Log form as a dedicated React component matching the AQMD PDF layout. Header auto-fills from project data (permit #, project name, company). Entry table allows multiple observations per day with Date, Time, Visible Dust, Project Soils, Access Roads, Trackout, and Corrective Actions. Submits as typed JSONB to form_submissions table. This is the first of 5 forms and establishes the pattern for all others.

---

## CEO Directives

- "When the first form is filled out, it can then be a template for the next day" -- Andy
- Form layout should match the original AQMD PDF as closely as reasonable
- Multiple entries per day allowed (minimum 1)
- Header auto-fills from project data -- zero manual entry for project info

---

## Acceptance Criteria

- [ ] Form component renders with header section: Permit #, Project Name, Company/Contractor (auto-filled from project)
- [ ] Entry table with columns: Date, Time, Visible Dust (Y/N), Project Soils (Crusted/Damp/Dry/Loose/Powdery), Access Roads (Crusted/Damp/Paved/Dry), Trackout (Y/N), Corrective Actions/Comments (textarea)
- [ ] "Add Entry" button adds another row to the table
- [ ] Remove entry button on each row (minimum 1 row required)
- [ ] Date defaults to today, Time defaults to current time
- [ ] Zod validation: at least 1 entry required, date and time required per entry
- [ ] Submit saves to form_submissions with form_type='dust_log', correct project_id, status='submitted'
- [ ] Data stored as typed JSONB matching the Zod schema
- [ ] Success feedback after submission
- [ ] Form accessible from the Dust Log tab on the project detail page

---

## Tasks

- [ ] T-06.1: Create Zod schema and TypeScript types for Dust Log (0.5h)
- [ ] T-06.2: Build DailyDustLog form component with React Hook Form (2h)
- [ ] T-06.3: Implement dynamic entry rows (add/remove) (0.5h)
- [ ] T-06.4: Write server action for form submission (insert into form_submissions) (0.5h)
- [ ] T-06.5: Wire form into project detail Dust Log tab (0.5h)
- [ ] T-06.6: Add auto-fill from project data (0.5h)
- [ ] T-06.7: Test form submission and data integrity (0.5h)

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/forms/dust-log/DailyDustLog.tsx` | CREATE -- Editable form component (~200 lines) |
| `src/components/forms/dust-log/dust-log.types.ts` | CREATE -- TypeScript interfaces (~30 lines) |
| `src/components/forms/dust-log/dust-log.schema.ts` | CREATE -- Zod validation schema (~40 lines) |
| `src/app/dashboard/projects/[id]/forms/dust-log/new/page.tsx` | CREATE -- New dust log entry page (~30 lines) |
| `src/app/dashboard/projects/actions.ts` | MODIFY -- Add submitForm server action |

---

## Key Interfaces

```typescript
// src/components/forms/dust-log/dust-log.types.ts
interface DustLogEntry {
  date: string;       // YYYY-MM-DD
  time: string;       // HH:MM
  visible_dust: 'Y' | 'N';
  project_soils: 'crusted' | 'damp' | 'dry' | 'loose' | 'powdery';
  access_roads: 'crusted' | 'damp' | 'paved' | 'dry';
  trackout: 'Y' | 'N';
  corrective_actions: string;
}

interface DustLogData {
  permit_number: string;
  project_name: string;
  company: string;
  entries: DustLogEntry[];
}

// Component props
interface DailyDustLogProps {
  project: {
    id: string;
    name: string;
    // ... fields needed for auto-fill
  };
  initialData?: DustLogData; // For "Use Previous"
}
```

---

## Technical Approach

| Component | Verdict | Rationale |
|-----------|---------|-----------|
| Form library | React Hook Form + Zod | useFieldArray for dynamic entry rows |
| Auto-fill | Props from project data | Server component passes project to client form |
| Storage | JSONB in form_submissions | Typed by Zod schema, queryable via Supabase |
| Dropdowns | Native select elements | Simple, accessible, no library needed |

---

## Testing

Manual verification:
- Open Dust Log tab on project with SAD permit
- Click "New Entry" -- form loads with project data auto-filled
- Add multiple entries -- all render correctly
- Remove an entry -- works (can't remove last one)
- Submit -- data appears in form_submissions table with correct structure
- Validation errors show for missing required fields
- Source PDF comparison: layout reasonably matches AQMD Daily Dust Log
