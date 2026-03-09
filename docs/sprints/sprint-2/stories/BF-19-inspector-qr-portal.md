# BF-19: Inspector QR Portal

**Sprint:** Sprint 2 - All Forms + Documents + Inspector Portal
**Story Points:** 5
**Priority:** MEDIUM
**Dependencies:** BF-11, BF-14, BF-15, BF-16, BF-17
**Status:** NOT STARTED
**Created:** 2026-03-09
**Last Updated:** 2026-03-09T16:00:00Z
**Backlog Ref:** Salvage S4-007, S4-008

---

## Summary

Build the inspector QR portal -- a public (no login) read-only view of a project's completed forms, documents, and permits. Inspectors scan a QR code on-site, which links to a token-authenticated page showing everything an inspector needs. Requires new `qr_tokens` table, token generation UI on project detail page, and a public route that validates the token and renders project content.

---

## CEO Directives

- "Ideally a QR code that an inspector could scan and then would take them to a read-only version of the project folder and its contents" -- Andy transcript
- Inspector has no account (QR token access, no login)
- Shows: Completed Forms (grouped by type), Documents, Permits, Project Info

---

## Acceptance Criteria

- [ ] `qr_tokens` table: id, project_id, token (UUID), expires_at, created_at, created_by
- [ ] "Generate QR Code" button on project detail page (admin only)
- [ ] QR code generated and displayed (using a QR library or inline SVG)
- [ ] Public route at /inspector/[token] (no auth required)
- [ ] Token validation: check exists, not expired, return project_id
- [ ] Portal tabs: Completed Forms, Documents, Permits, Project Info
- [ ] Completed Forms tab: grouped by form type, chronological within each, uses read-only view components
- [ ] Documents tab: list of uploaded documents with download links
- [ ] Permits tab: list of project permits with permit numbers
- [ ] Project Info: name, address, key contacts
- [ ] Read-only -- no edit controls anywhere
- [ ] Clean, professional layout suitable for inspector viewing

---

## Tasks

- [ ] T-19.1: Create `qr_tokens` table in Supabase (0.25h)
- [ ] T-19.2: Create server action: generateQrToken(projectId) (0.25h)
- [ ] T-19.3: Add QR generation UI to project detail header (0.5h)
- [ ] T-19.4: Create public route /inspector/[token]/page.tsx with token validation (0.5h)
- [ ] T-19.5: Build portal layout with tabs (1h)
- [ ] T-19.6: Build Completed Forms tab -- fetch submissions, render with *View components (1h)
- [ ] T-19.7: Build Documents + Permits + Project Info tabs (0.5h)
- [ ] T-19.8: Test full flow: generate QR -> scan (open link) -> view portal (0.5h)

---

## Files to Modify

| File | Change |
|------|--------|
| `src/app/inspector/[token]/page.tsx` | CREATE -- portal page with token validation (~80 lines) |
| `src/components/inspector/InspectorPortal.tsx` | CREATE -- portal layout with tabs (~200 lines) |
| `src/lib/queries/inspector.ts` | CREATE -- getProjectByToken, getPortalData queries (~40 lines) |
| `src/app/dashboard/projects/[id]/actions.ts` | MODIFY -- add generateQrToken action |
| `src/app/dashboard/projects/[id]/page.tsx` | MODIFY -- add QR code button to header |

---

## Key Interfaces

```typescript
interface QrToken {
  id: string;
  project_id: string;
  token: string;
  expires_at: string;
  created_at: string;
  created_by: string;
}

interface PortalData {
  project: {
    name: string;
    address: string;
    superintendent_name: string | null;
    // other contact fields
  };
  permits: Array<{ permit_type: string; permit_number: string | null }>;
  documents: Array<{ name: string; category: string; file_url: string }>;
  submissions: Array<{
    id: string;
    form_type: string;
    form_date: string;
    data: unknown;
    status: string;
  }>;
}
```

---

## Technical Approach

| Component | Verdict | Rationale |
|-----------|---------|-----------|
| QR generation | `qrcode` npm package or inline SVG | Lightweight, no heavy deps |
| Token auth | UUID token in URL, validated server-side | No session needed, stateless |
| Token expiry | Default 30 days, admin can regenerate | Security without hassle |
| Portal route | Outside /dashboard (no auth middleware) | Public access for inspectors |
| Form rendering | Reuse *View components from BF-11/14/15/16 + dust log | No duplicate code |

---

## Testing

Manual verification:
- Admin generates QR code for project
- Open QR link in incognito (no login)
- Portal shows: project info, permits, documents, completed forms
- Click a form -> read-only view renders correctly
- Expired token shows appropriate error
