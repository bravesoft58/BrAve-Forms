# BF-71: Download photos from a completed inspection, with where they were taken

**Type:** Feature (photo handling on the submission view and PDF; all photo forms benefit)
**Priority:** MEDIUM (Gracie's ask; the record is complete without it)
**Points:** 2
**Status:** NOT STARTED
**Sprint:** 4 (backlog)
**Reported by:** Gracie's handwritten notes on the PDF page of her 2026-10-07 test submission ("Can I download this photo? Can the photo have coordinates?"), forwarded by Andy Breen 2026-10-08. Filed under [docs/reference/WIW-Gracie-comments-2026-10-08.pdf](../../../reference/WIW-Gracie-comments-2026-10-08.pdf).
**Created:** 2026-10-08
**Last Updated:** 2026-10-08T14:35:51Z

## Problem

Two separate gaps.

**Download.** The submission view page and the PDF render each photo as an image with no way to save the original. A Storage signed URL can be opened in a new tab, but the browser's `download` attribute is ignored on a cross-origin URL, so "save as" needs a same-origin route that streams the file with a `Content-Disposition: attachment` header.

**Coordinates.** Nothing records where a photo was taken.
- The upload path runs every photo through `browser-image-compression` (installed 2.0.2, checked 2026-10-08). Files over the size or pixel limit are re-encoded, which strips EXIF including GPS; the library's `preserveExif` option is off. Smaller files pass through unchanged with their tags.
- Even with tags preserved, nothing reads or shows them, and whether iPhone Safari passes GPS tags through the file picker at all is unverified. Needs a real-device test before the EXIF route is relied on.
- The dependable source is the browser's geolocation prompt at attach time: it does not depend on the phone's camera settings, and it works when the crew shoots in the app. It records where the uploader stood when attaching, which is the same place when the photo is taken on site.

## Proposed change

### Download
- A per-photo "Download" link on the Working in Waterways submission view (and the other photo-form views, same component). It points at a new same-origin route, for example `GET /api/forms/[submissionId]/photos/[fileName]`, which checks the caller can read the submission (same check as the PDF route), signs or streams the object from `form-attachments`, and sets `Content-Disposition: attachment` with a readable name (project, form, date, index).
- Inspector portal: same link, bounded by the session's `accessUntil` like the document links in `queries/inspector.ts`.

### Coordinates
- `photoSchema` gains optional `lat`, `lng`, `accuracy_m` and `captured_at`. Optional so every existing photo still parses.
- `PhotoAttachment` requests the position once per attach batch via `navigator.geolocation.getCurrentPosition` (short timeout, high accuracy off). Denied or unavailable: the photo uploads without coordinates and the UI says so once, not per photo. Position is read before compression starts so a slow upload does not skew it.
- Also set `preserveExif: true` in the compression options so the stored file keeps the camera's own tags for anyone who downloads it. This is independent of the geolocation value; the app displays the geolocation value only.
- View, inspector detail and PDF show "Taken at {lat}, {lng}" under the caption when present, with a plain Google Maps link on the web views. The PDF prints the numbers only.
- Scout question: confirm with Gracie that a decimal lat/long plus a map link is what she needs, as opposed to something the permit requires in a specific format.

## Acceptance criteria

- [ ] Each photo on a submission view has a Download link that saves the stored file with a readable name; a user who cannot read the submission gets 404 from the route.
- [ ] Inspector portal photos download the same way and stop working when the session expires.
- [ ] A photo attached with location permission granted stores `lat`, `lng`, `accuracy_m`, `captured_at` and shows "Taken at" on the view, inspector detail and PDF.
- [ ] Permission denied or no position: upload still succeeds, one notice is shown, record parses.
- [ ] Existing submissions without coordinates render exactly as before.
- [ ] Real phone test (iPhone and the Android tablet, as BF-58.2): coordinates captured on site match the map within the reported accuracy.
- [ ] `pnpm build`, lint and tests clean.

## Depends on

- Nothing. Related: [BF-68](BF-68-pdf-photo-drop-fails-silently.md) (PDF photo drops) and [BF-64](BF-64-submit-waits-for-photo-uploads.md) (uploads in flight) touch the same component; sequence to avoid a three-way merge on `PhotoAttachment`.
