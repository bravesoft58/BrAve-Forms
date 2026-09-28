# BF-68: Photo PDFs must never drop a photo silently

**Type:** Bug (record integrity; a compliance PDF can look complete while missing required evidence)
**Priority:** MEDIUM (needs an unusual upload format or a failed photo fetch; ordinary phone JPEGs render correctly)
**Points:** 2
**Status:** NOT STARTED
**Sprint:** 4 (backlog)
**Reported by:** BF-58.2 `/verify` round 1 and the re-verify (finding C1, raised by both verify and Codex), filed at closeout 2026-09-28
**Created:** 2026-09-28
**Last Updated:** 2026-09-28T16:49:18Z

## Problem

The PDF library (`@react-pdf/renderer` 4.3.2) draws only JPEG and PNG. When it cannot fetch or decode a photo, it leaves the image out and still returns the PDF with HTTP 200. The caption prints, but there is no image and no "unavailable" note. Two ways in:

- **WebP uploads.** The photo picker's `accept` list, the `form-attachments` bucket's allowed types, and the compression step (no `fileType` set) all let a WebP file through as `image/webp`. Codex reproduced the dropped image.
- **Failed fetches.** A signed URL that returns an error (Storage 5xx, a rejected request) has the same result.

This affects both photo PDFs: NDOT Weekly Stormwater (since BF-32) and Working in Waterways (BF-58.2). BF-58.2 only covers the case where the signed URL is missing entirely, which prints "Photo unavailable".

Real-device check on 2026-09-28: an iPhone and an Android tablet both uploaded JPEGs that rendered upright. The risk is the unusual input, not the normal camera path.

## Proposed change

- **Close the entry point:** convert WebP to JPEG before upload (browser-image-compression's `fileType: "image/jpeg"`), or remove WebP from the picker and bucket accept lists.
- **Fail loudly in the PDF:** fetch each photo on the server before rendering, check its type and that it decodes, and print "Photo could not be included" (with the file name) instead of an empty space. Never return a PDF that silently has fewer images than the record.
- **Tests:** a WebP fixture and a failing-URL fixture, each asserting the notice is printed. The existing image-count assertion in `Testing/forms/bf58_2_waterways_pdf_test.ts` is the pattern to copy.

## Acceptance criteria

- [ ] A WebP photo either cannot be uploaded or reaches Storage as JPEG, and renders in both photo PDFs.
- [ ] A photo that cannot be fetched or decoded prints a visible notice in the PDF; the record's photo count always equals images plus notices.
- [ ] Applies to NDOT Weekly Stormwater and Working in Waterways.
- [ ] Tests cover WebP and a failed fetch; `pnpm build` and lint clean.
