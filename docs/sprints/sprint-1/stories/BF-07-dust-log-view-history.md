# BF-07: Dust Log Read-Only View + Form History + Use Previous

**Sprint:** Sprint 1 - Foundation + First Form
**Story Points:** 3
**Priority:** MEDIUM
**Dependencies:** BF-06
**Status:** NOT STARTED
**Created:** 2026-03-05
**Last Updated:** 2026-03-05T00:00:00Z
**Backlog Ref:** Andy Salvage Plan Section 6 (Form Continuity), Salvage Sprint S2-006/S2-008/S2-009

---

## Summary

Three capabilities that complete the Dust Log workflow: (1) Read-only view of submitted dust logs with clean, printable layout. (2) Form log history tab showing all submissions for a project, sorted by date. (3) "Use Previous" button that loads the most recent submission's data into a new form entry, clearing date/time fields. Together these implement Andy's "use the form from the previous day as your baseline" requirement.

---

## CEO Directives

- "Each day that a form is filled out, it then gets saved as a full document" -- Andy
- "You can reference back the forms that were completed on a specific day, or you can use the form from the previous day as your baseline" -- Andy
- Read-only view should be clean and printable (PDF-like)
- "Use Previous" clears date/time, keeps everything else

---

## Acceptance Criteria

- [ ] DailyDustLogView component renders submitted data in read-only format
- [ ] Read-only view matches original PDF layout (table format, clean headers)
- [ ] No edit controls in read-only view
- [ ] Form log tab on project detail page shows list of submissions: date, submitted by, status
- [ ] Submissions sorted by date (newest first)
- [ ] Click submission in list opens read-only view
- [ ] "New Entry" button at top of form log tab
- [ ] "Use Previous" button on new entry form
- [ ] "Use Previous" loads most recent submission's data into form
- [ ] Date/time fields cleared when using previous (user enters today's values)
- [ ] All other fields pre-filled from previous submission
- [ ] Empty state when no submissions exist ("No dust log entries yet")

---

## Tasks

- [ ] T-07.1: Build DailyDustLogView read-only component (1h)
- [ ] T-07.2: Build FormLogTab component (submission list + new entry button) (1h)
- [ ] T-07.3: Implement "Use Previous" -- query latest submission, pass as initialData to form (0.5h)
- [ ] T-07.4: Wire view/list into project detail Dust Log tab (0.25h)
- [ ] T-07.5: Test full flow: create, view, use previous (0.25h)

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/forms/dust-log/DailyDustLogView.tsx` | CREATE -- Read-only view component (~100 lines) |
| `src/components/projects/FormLogTab.tsx` | CREATE -- Generic form log tab (list + actions) (~80 lines) |
| `src/app/dashboard/projects/[id]/forms/dust-log/[submissionId]/page.tsx` | CREATE -- View submitted dust log (~30 lines) |
| `src/lib/queries/submissions.ts` | CREATE -- getSubmissions, getLatestSubmission queries (~30 lines) |

---

## Key Interfaces

```typescript
// src/lib/queries/submissions.ts
export async function getSubmissions(
  projectId: string,
  formType: FormType
): Promise<FormSubmission[]>

export async function getLatestSubmission(
  projectId: string,
  formType: FormType
): Promise<FormSubmission | null>

// FormLogTab props
interface FormLogTabProps {
  projectId: string;
  formType: FormType;
  formLabel: string; // "Daily Dust Log"
  newEntryHref: string;
  viewComponent: React.ComponentType<{ data: any }>;
}
```

---

## Technical Approach

| Component | Verdict | Rationale |
|-----------|---------|-----------|
| Read-only view | Separate component (not disabled form) | Cleaner, printable, no form library overhead |
| Form history | Server component with Supabase query | No client-side fetching for list |
| Use Previous | Server action loads data, passes as prop | initialData prop on DailyDustLog component |
| Print styling | @media print CSS | Simple, no PDF library needed for now |

---

## Testing

Manual verification:
- Submit a dust log entry
- View it in form log tab -- appears in list
- Click to view -- read-only render matches submitted data
- Start new entry with "Use Previous" -- previous data loads, date/time cleared
- Submit second entry -- both appear in history
- Print the read-only view -- clean output without nav/chrome
