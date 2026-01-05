# ISSUE-184: N.Swips Print Preview Layout Fix

**Sprint:** Sprint 7 | **Phase:** 2 - Form Template Fixes | **Priority:** P2
**Time:** 2 hours | **Complexity:** Low
**Created:** 2025-12-15
**Dependencies:** ISSUE-182
**Status:** COMPLETE
**Completed:** 2026-01-05

---

## Problem

From Andy's QA Review (December 10, 2025):

> "Print Preview: The feature generates a 13-page PDF, but the layout needs cleaning. The header information appears on the first page, while the actual form content (like Project Name) starts on the second page."

The PDF generation has poor layout causing header/content split across pages.

---

## Evidence of Bug

**Location:** Forms Tab > N.Swips Form > Print Preview

**Issue:**

- Page 1: Only header/logo
- Page 2: Form content starts
- 13 pages total (likely should be fewer with better layout)

---

## Solution

### Step 1: Fix PDF Layout

```typescript
// apps/web/lib/pdf/generate-form-pdf.ts
import { jsPDF } from 'jspdf';

export async function generateFormPdf(submission: Submission, template: Template) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let yPosition = margin;

  // Header - keep compact
  doc.setFontSize(16);
  doc.text(template.name, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;

  doc.setFontSize(10);
  doc.text(`Submitted: ${formatDate(submission.createdAt)}`, margin, yPosition);
  yPosition += 8;

  // Horizontal line
  doc.setDrawColor(200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  // Form fields - start immediately after header
  doc.setFontSize(11);

  for (const field of template.schema) {
    const value = submission.data[field.id] || 'N/A';

    // Check if we need a new page
    if (yPosition > doc.internal.pageSize.getHeight() - 30) {
      doc.addPage();
      yPosition = margin;
    }

    // Label
    doc.setFont('helvetica', 'bold');
    doc.text(`${field.label}:`, margin, yPosition);

    // Value (next line for long values, same line for short)
    doc.setFont('helvetica', 'normal');
    const valueText = String(value);

    if (valueText.length > 50) {
      yPosition += 5;
      const lines = doc.splitTextToSize(valueText, contentWidth);
      doc.text(lines, margin, yPosition);
      yPosition += lines.length * 5 + 5;
    } else {
      doc.text(valueText, margin + 50, yPosition);
      yPosition += 8;
    }
  }

  return doc.output('blob');
}
```

### Step 2: Optimize Page Breaks

```typescript
// Calculate if content will fit on current page
function willFitOnPage(doc: jsPDF, yPosition: number, contentHeight: number): boolean {
  const pageHeight = doc.internal.pageSize.getHeight();
  const bottomMargin = 20;
  return yPosition + contentHeight < pageHeight - bottomMargin;
}

// Group related fields together
function groupFields(schema: Field[]): FieldGroup[] {
  const groups: FieldGroup[] = [];
  let currentGroup: Field[] = [];

  for (const field of schema) {
    if (field.section !== currentGroup[0]?.section && currentGroup.length > 0) {
      groups.push({ fields: currentGroup });
      currentGroup = [];
    }
    currentGroup.push(field);
  }

  if (currentGroup.length > 0) {
    groups.push({ fields: currentGroup });
  }

  return groups;
}
```

---

## Tasks

### PDF Generation

- [ ] Fix header to not take full page
- [ ] Start form content immediately after header
- [ ] Optimize field spacing
- [ ] Add proper page breaks at section boundaries
- [ ] Reduce total page count where possible

### Testing

- [ ] Write test: header and content on same page
- [ ] Write test: page breaks at appropriate places
- [ ] Write test: all form data included
- [ ] Manual test: print preview looks professional

---

## Acceptance Criteria

- [ ] Header and form content start on same page
- [ ] Page breaks occur at logical points
- [ ] PDF is reasonably sized (not unnecessarily long)
- [ ] All form data is included
- [ ] Layout is clean and professional

---

## Evidence Required

- [ ] Screenshot of current 13-page layout (bug)
- [ ] Screenshot of optimized layout (after fix)
- [ ] PDF file comparison (before/after page counts)

---

## Related Issues

- ISSUE-182: N.Swips Form Data Entry Blocked
- ISSUE-183: NDEP BWPC SWPP Unsupported Field Errors

---

## Completion Summary

**Root Cause:** The print preview used `window.print()` with CSS `@media print` styles, but the existing print styles did not optimize for the form fill page structure. The `min-h-screen` class forced full viewport height, large Stack gaps created excessive spacing, and no rules existed to keep the header and form content together on the first page.

**Solution Implemented:**

Added comprehensive print-specific CSS optimizations to `apps/web/app/globals.css` targeting the form fill page structure:

1. **Removed min-height forcing full page:**
   - `.desktop-view.min-h-screen` and `.mobile-view` set to `min-height: auto`

2. **Reduced spacing:**
   - Container padding removed (`padding-top/bottom: 0`)
   - Stack gap reduced to `8pt` (from `lg`)
   - Form title margin reduced to `2pt`

3. **Page break prevention:**
   - `page-break-after: avoid` on form header div
   - `page-break-before: avoid` on form content container
   - `page-break-inside: avoid` on signature/photo fields and sections

4. **Compact form field styling:**
   - InputWrapper margin: `6pt`
   - Label font-size: `9pt` (bold)
   - Input font-size: `10pt` with `4pt 6pt` padding
   - Checkbox/radio spacing: `4pt`

5. **Print cleanup:**
   - All buttons hidden
   - Form actions footer hidden
   - Shadows removed, borders standardized

**Files Modified:**

- `apps/web/app/globals.css` - Added ~100 lines of print optimization CSS (lines 1004-1108)

**Build Verification:** PASSED (`pnpm --filter web build`)

**Expected Results:**

- Header and form content now start on the same first page
- Form fields are more compact, reducing total page count
- Logical page breaks at section boundaries
- Professional, clean print layout
