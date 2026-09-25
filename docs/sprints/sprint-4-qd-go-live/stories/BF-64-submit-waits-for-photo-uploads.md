# BF-64: Submit must wait for photo uploads in flight

**Type:** Bug (shared form component; data loss of an attached photo)
**Priority:** MEDIUM (the one-photo minimum still holds; an extra photo can be lost silently)
**Points:** 1
**Status:** NOT STARTED
**Sprint:** 4 (backlog)
**Reported by:** BF-58.1 `/verify` round 1 (finding C1, headless verify with Codex reconciled), filed at closeout 2026-09-25
**Created:** 2026-09-25
**Last Updated:** 2026-09-25T17:04:32Z

## Problem

`PhotoAttachment` tracks its own `uploading` state, but the forms that host it gate their submit button only on the server action's `pending`. If a user attaches a second photo and presses Submit while it is still uploading, the form sends the draft as it stands: the in-flight photo is not in `data.photos`, the submission saves without it, and the upload that finishes afterwards lands as an unreferenced file. Nobody is told.

Affected: the Working in Waterways form (BF-58.1) and the NDOT Weekly Stormwater form, which shares the same gating and has this behaviour in production today. Found by BF-58.1's verify, which judged it inherited rather than introduced.

## Proposed change

- Lift the upload state out of `PhotoAttachment`, for example with an `onUploadingChange(boolean)` callback, or by making it a controlled prop.
- Each host form disables Submit (and shows "Waiting for photos to finish uploading") while any upload is in flight.
- Keep BF-58.1 Codex round 2's `disabled` prop behaviour (photo controls locked while saving).

## Acceptance criteria

- [ ] With a photo upload in flight, Submit is disabled on the Working in Waterways and NDOT forms, and becomes enabled when the upload finishes or fails.
- [ ] A submission made after the upload completes contains every attached photo.
- [ ] No change to the no-delete photo rule (BF-58.1 round 2).
- [ ] `pnpm build` and lint clean.
