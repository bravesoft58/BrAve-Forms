# BF-04: Project Creation (Full Fields + Permits)

**Sprint:** Sprint 1 - Foundation + First Form
**Story Points:** 5
**Priority:** HIGH
**Dependencies:** BF-01, BF-03
**Status:** COMPLETE
**Created:** 2026-03-05
**Last Updated:** 2026-03-05T00:00:00Z
**Backlog Ref:** Andy Salvage Plan Section 4 (Project Setup), Salvage Sprint S2-001/S2-002

---

## Summary

Build the project creation page with all fields from Andy's Project Setup spec. Includes required fields (name, address, start/completion dates), optional contact fields (superintendent, foreman, PM, owner rep), site details (acres, soil type, parcel numbers), and permit selection with automatic form requirement triggers. This is the entry point to Andy's entire workflow.

---

## CEO Directives

- "When setting up a project, this information should be enough to autofill the forms" -- Andy
- Required fields: project name, address, start date, completion date
- All contact fields optional (can fill later)
- Permit selection triggers form requirements automatically (SAD/Dust Control -> Dust Log, etc.)
- Admin can manually add forms beyond what permits trigger

---

## Acceptance Criteria

- [ ] `/dashboard/projects/new` page with multi-section form
- [ ] Section 1 - Basic Info (required): Project Name, Address, Start Date, Completion Date
- [ ] Section 2 - Contacts (optional): Superintendent (name/phone/email), Foreman (name/phone/email), PM (name/phone/email), Owner Rep (name/phone/email/address)
- [ ] Section 3 - Site Details (optional): Acres Disturbed, Soil Type, Parcel Numbers, Description
- [ ] Section 4 - Permits: Checkboxes for 6 permit types, optional permit number per selected permit
- [ ] Permit selection shows informational preview: "Selected permits will require: [form list]"
- [ ] Form validation with Zod -- required fields enforced, email/phone format validated
- [ ] On submit: creates project record, creates project_permits records, auto-creates project_form_requirements based on permit-to-form mapping
- [ ] Success redirects to project detail page
- [ ] Error handling with user-friendly messages

---

## Tasks

- [ ] T-04.1: Create Zod schema for project creation form (0.5h)
- [ ] T-04.2: Build multi-section form UI with all fields (2h)
- [ ] T-04.3: Implement permit selection with form trigger preview (0.5h)
- [ ] T-04.4: Write server action for project creation (insert project + permits + form requirements) (1h)
- [ ] T-04.5: Add form validation, error handling, loading states (0.5h)
- [ ] T-04.6: Test full creation flow (0.5h)

---

## Files to Modify

| File | Change |
|------|--------|
| `src/app/dashboard/projects/new/page.tsx` | CREATE -- Project creation page (~50 lines, delegates to form component) |
| `src/components/projects/ProjectForm.tsx` | CREATE -- Multi-section project form (~250 lines) |
| `src/lib/schemas/project.ts` | CREATE -- Zod schema for project validation (~60 lines) |
| `src/app/dashboard/projects/actions.ts` | CREATE -- Server actions for project CRUD (~80 lines) |
| `src/lib/constants/permits.ts` | CREATE -- Permit-to-form mapping constants (~30 lines) |

---

## Key Interfaces

```typescript
// src/lib/constants/permits.ts
export const PERMIT_FORM_MAP: Record<PermitType, FormType[]> = {
  sad: ['dust_log'],
  dust_control: ['dust_log'],
  stormwater_ndot: ['ndot_stormwater'],
  stormwater_ndep: ['ndep_stormwater'],
  waterway: [],
  other: [],
};

// src/lib/schemas/project.ts
export const projectCreateSchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  start_date: z.string().date(),
  completion_date: z.string().date(),
  superintendent_name: z.string().optional(),
  // ... all optional fields
  permits: z.array(z.object({
    permit_type: z.enum([...permitTypes]),
    permit_number: z.string().optional(),
  })).optional(),
});
```

---

## Technical Approach

| Component | Verdict | Rationale |
|-----------|---------|-----------|
| Form library | React Hook Form + Zod | Standard, works with server actions |
| Server action | Next.js Server Action | Direct Supabase insert, no API route needed |
| Permit logic | Client-side preview + server-side insert | Show user what forms will be required, then create records on submit |
| Multi-section | Accordion/collapsible sections | Progressive disclosure per UX doc |

---

## Testing

Manual verification:
- Create project with only required fields -- succeeds
- Create project with all fields -- all data saved correctly
- Select SAD permit -- see "Daily Dust Log will be required" preview
- Submit -- verify project, permits, and form requirements all created in DB
- Validation errors show for missing required fields
