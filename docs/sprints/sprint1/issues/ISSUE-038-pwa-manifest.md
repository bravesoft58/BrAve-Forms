# ISSUE-038: Create PWA Manifest File

**Sprint:** Sprint 1 | **Phase:** Phase 5 - PWA & Offline | **Priority:** P1
**Time:** 15 minutes | **Points:** 1 | **Status:** Not Started
**Created:** 2025-10-01 16:40:00 EDT
**Dependencies:** ISSUE-037 ✅

---

## What You'll Do

Define PWA metadata for app installation and appearance.

---

## Step-by-Step Instructions

### Prerequisites
- ISSUE-037 complete (service worker configured)

### Steps

1. Create `apps/web/public/` directory if missing:
```bash
mkdir -p apps/web/public
```

2. Create `manifest.json` file:
```json
{
  "name": "BrAve Forms - Construction Compliance",
  "short_name": "BrAve Forms",
  "description": "EPA/OSHA construction compliance management with 30-day offline capability",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1976d2",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

3. Create placeholder icon files (simple colored squares for now):
   - Create 192x192px PNG: `apps/web/public/icon-192x192.png`
   - Create 512x512px PNG: `apps/web/public/icon-512x512.png`

4. Add manifest link to `apps/web/app/layout.tsx`:
```typescript
export const metadata = {
  manifest: '/manifest.json',
};
```

5. Save all files

---

## Files to Create

**New Files:**
- `apps/web/public/manifest.json`
- `apps/web/public/icon-192x192.png` (placeholder)
- `apps/web/public/icon-512x512.png` (placeholder)

**Modified:**
- `apps/web/app/layout.tsx` (add manifest metadata)

---

## Verification Checklist

- [ ] manifest.json created
- [ ] All required fields present (name, short_name, start_url, display, icons)
- [ ] Icons referenced (placeholder OK for now)
- [ ] Valid JSON format
- [ ] Manifest linked in layout.tsx
- [ ] Build succeeds

---

## Testing Steps

1. Validate JSON:
```bash
cat apps/web/public/manifest.json | jq .
```

2. Build app:
```bash
pnpm --filter web build
```

3. Check manifest accessible:
```bash
curl http://localhost:3000/manifest.json
```

---

## Evidence Requirements

**Location:** `evidence/ISSUE-038/code/`

**Required Screenshots:**
1. `manifest-json.png` - manifest.json content
2. `public-directory.png` - public/ folder showing manifest and icons

---

## Troubleshooting

**Problem:** JSON validation errors
- Use online validator: jsonlint.com
- Check for trailing commas
- Verify all strings use double quotes

**Problem:** Icons not found
- Use online tool to create simple placeholder: placeholder.com
- Or use solid color squares in any image editor
- Ensure exact filenames match manifest

**Problem:** Manifest not loading
- Check file is in public/ directory
- Verify Next.js serves /manifest.json route
- Check layout.tsx metadata is correct

---

## Success Criteria

- manifest.json created with all required fields
- Icon files exist (placeholder OK)
- Manifest linked in layout.tsx
- Valid JSON format
- Build succeeds
- Evidence collected

---

## Next Issue

**ISSUE-039:** Add Manifest to HTML Head (10 minutes)

---

**Created By:** Project Manager Agent
**Assigned To:** Junior Developer
**Priority:** P1
**Estimated Time:** 15 minutes
