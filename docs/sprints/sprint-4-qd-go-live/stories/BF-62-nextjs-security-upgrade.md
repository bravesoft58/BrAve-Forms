# BF-62: Upgrade Next.js out of the 2026 proxy-bypass advisory ranges

**Type:** Security upgrade (framework dependency)
**Priority:** HIGH (the dashboard's login redirect runs in `proxy.ts`)
**Points:** 2
**Status:** NOT STARTED
**Sprint:** 4
**Reported by:** BF-56 scout, 2026-09-23; Tim directed it into this sprint the same day
**Created:** 2026-09-23
**Last Updated:** 2026-09-23T13:46:48Z
**Blocks:** BF-56

## Problem

The repo pins `next` and `eslint-config-next` at 16.1.6. That version sits inside two published advisory ranges that let a request bypass middleware/proxy logic [verified 2026-09-23]:

- CVE-2026-44573, auth bypass, fixed in 16.2.5. [verified 2026-09-23]
- CVE-2026-64642 / GHSA-6gpp-xcg3-4w24, proxy bypass in App Router apps using Turbopack with a single locale, affects `>=16.0.0 <16.2.11`, fixed in 16.2.11. [verified 2026-09-23]

`src/proxy.ts` redirects signed-out users away from `/dashboard`. Pages and server actions mostly re-check the user themselves, but the proxy is the first gate, and BF-56 adds a cookie-based inspector session that must not rest on a bypassable layer.

This also closes part of the "dependencies" readiness gate from the 2026-09-08 assessment. It does not attempt the rest of that gate's advisories.

## Scope

1. Bump `next` and `eslint-config-next` to the latest 16.x patch available at build time, never below 16.2.11. Check the React peer range for that release and bump `react` and `react-dom` only if it requires. [verified 2026-09-23]
2. Regenerate `pnpm-lock.yaml` with the pinned pnpm 8.15.9 (`npx --yes pnpm@8.15.9 install`), never the global pnpm 11. <!-- staleness-lint:ignore  repo-internal pin, not an outside-world claim -->
3. Read the Next.js release notes between 16.1.6 and the target for breaking changes that touch this app: `proxy.ts`, async `cookies()` / `params`, Route Handlers, server actions, image and font config. <!-- staleness-lint:ignore  repo-internal pin, not an outside-world claim -->
4. Run `eslint`, `tsc --noEmit`, `next build` on the final tree.
5. Smoke the upgraded preview while signed in: dashboard loads, one project page, one form view, one PDF download, the inspector portal from an existing QR code; signed out: `/dashboard` redirects to login.
6. Re-run `pnpm audit` (or the equivalent) and record which advisories remain, so the readiness gate has a current count.

## Out of scope

- Vercel's Node 24 runtime vs the repo's Node 22 pin (tracked separately).
- Advisories in other packages, except those the Next bump clears on its own.

## Acceptance criteria

- [ ] `next` and `eslint-config-next` at a 16.x release at or above 16.2.11, lockfile regenerated with pnpm 8.15.9.
- [ ] `eslint` 0 errors, `tsc --noEmit` clean, `next build` clean on the committed tree.
- [ ] Signed-in smoke on the branch preview passes (dashboard, project, form view, PDF, inspector portal), and signed-out `/dashboard` redirects to login.
- [ ] Audit output before and after is recorded here.
- [ ] Production deploy after merge reaches READY and the same signed-out redirect holds on production.

## Notes

- Merge before BF-56 starts building, so BF-56 is developed and verified on the patched framework.
