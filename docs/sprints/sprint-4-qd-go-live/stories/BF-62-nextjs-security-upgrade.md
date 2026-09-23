# BF-62: Upgrade Next.js out of the 2026 proxy-bypass advisory ranges

**Type:** Security upgrade (framework dependency)
**Priority:** HIGH (the dashboard's login redirect runs in `proxy.ts`)
**Points:** 2
**Status:** NOT STARTED
**Sprint:** 4
**Reported by:** BF-56 scout, 2026-09-23; Tim directed it into this sprint the same day
**Created:** 2026-09-23
**Last Updated:** 2026-09-23T13:51:33Z
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

## Technical Approach (scout, 2026-09-23T13:51:33Z)

**Build vs Use:** USE. This is a version bump of an existing dependency; nothing is built. No registry standard covers the web framework, and swapping frameworks is out of question for a patch-level security fix.

### Target versions [verified 2026-09-23]

<!-- staleness-lint:off  table rows are covered by the dated heading above -->
| Package | Now | Target | Why |
| --- | --- | --- | --- |
| `next` | 16.1.6 | **16.3.6** (latest, released 2026-09-22) | Only 16.3.3+ clears the two critical advisories; 16.3.6 is the newest patch |
| `eslint-config-next` | 16.1.6 | 16.3.6 | Keep in lockstep with `next`; peers `eslint >=9` (repo has `^9`), `typescript >=3.3.1` |
| `react`, `react-dom` | 19.2.3 | unchanged | `next@16.3.6` peers `^18.2.0 || ^19.0.0`; audit lists no React advisories |
| `sharp` (via next, optional) | 0.34.5 | 0.35.4+ (next@16.3.6 declares `^0.35.4`) | Clears two `sharp`/libvips/libheif highs |
| `postcss` (via next) | 8.4.31 | 8.5.23 (pinned by next@16.3.6) | Clears the postcss advisories on next's copy only |
<!-- staleness-lint:on -->

### Audit baseline (`pnpm@8.15.9 audit`, master 1a46e69, 2026-09-23) [verified 2026-09-23]

69 advisories: 2 critical, 37 high, 26 moderate, 4 low. `next` itself carries 30 of them. By patched floor: 5 need `>=16.1.7`, 17 need `>=16.2.3` to `>=16.2.6`, 11 need `>=16.2.11`, and the 2 criticals need `>=16.3.3`. The rest are transitive: `brace-expansion` 9, `picomatch` 4, `postcss` 4 (two paths: next's and `@tailwindcss/postcss`'s), `js-yaml` 4, `nanoid` 3, `ws` 2 (via `@supabase/realtime-js`), `sharp` 2 (via next), and a few singles. Raw JSON is not committed; re-run the same command after the bump and record both counts in this story. [verified 2026-09-23]

Applicability on this deployment (Vercel, Linux, App Router, no `next/image` component in `src/`):
- Critical CVE-2026-75604 (RCE on **Windows-hosted** servers): not reachable on Vercel's Linux runtime, still fixed by the bump. [verified 2026-09-23]
- Critical GHSA-2xp9-vwfh-vxw4 (AVIF RCE via `sharp`/libheif in Image Optimization): Vercel disabled AVIF optimization in its managed service, and the app renders no `next/image`. Low practical exposure, still fixed by the bump.
- The proxy-bypass highs that matter here are the App Router ones: CVE-2026-44574 and CVE-2026-44575 (fixed 16.2.5), CVE-2026-45109 (16.2.6), CVE-2026-64642 (16.2.11). CVE-2026-44573, which the Problem section cites, is Pages Router with i18n and does not apply to this app. [verified 2026-09-23]

### Breaking changes between 16.1.6 and 16.3.6 [verified 2026-09-23]

None announced. The 16.2 and 16.3 release posts list features and performance work only; the breaking changes (async `cookies()`/`params`, `middleware.ts` renamed to `proxy.ts`, Turbopack default) all landed in 16.0 and the app is already on them. Changes worth knowing: [verified 2026-09-23]
- 16.3 bundles small prefetch requests together and enables the build disk cache by default. Instant Navigations, Partial Prefetching and Cache Components are opt-in; this app sets none of them (no `cacheComponents`, `use cache`, or `revalidateTag` anywhere). [verified 2026-09-23]
- 16.3 can use TypeScript 7 for type checking; optional, not part of this story. [verified 2026-09-23]

### Gotchas to carry into /story

1. **Vercel runtime regression with `sharp` 0.35.3 on 16.3.0 (HIGH).** Reports in the 16.3 feedback thread and issue #96650 describe production functions failing at module load on Vercel with `TypeError: Cannot read properties of undefined (reading 'output')`, starting with 16.3.0-preview.8 when next moved to `sharp ^0.35.3`. The issue was closed for lack of a reproduction, with no fix recorded. 16.3.6 declares `sharp ^0.35.4` (released 2026-08-26), which is unconfirmed either way. The branch preview smoke in AC 3 is the real test: load the dashboard, a server action, the PDF route, and the inspector portal on the preview before merge. **Fallback if it reproduces:** the latest 16.2.x patch (at least 16.2.11). That still clears every proxy-bypass advisory; it leaves the two criticals, neither reachable here as noted above. Record whichever outcome in the story.
2. **`package.json` carries your uncommitted June edit.** The `packageManager: pnpm@8.15.9` and `engines.node: 22.x` lines exist only in your working tree, not on master. That is why fresh worktrees ran the global pnpm 11. BF-62 must edit the same file, so decide before building: commit those two lines as part of BF-62 (they are exactly what the Node toolchain standard requires), or keep them out. [verified 2026-09-23]
3. **Committing `engines.node: 22.x` changes the production runtime.** Vercel honours `engines.node`, and production currently runs Node 24.x. Committing the June lines would move production to Node 22 in the same deploy as the framework bump. It is the standard's intended state, but it is a second runtime change; either accept it here and smoke both together, or leave `engines` out and take it in its own change. [verified 2026-09-23]
4. Regenerate the lockfile with `npx --yes pnpm@8.15.9 install`, never the global pnpm 11. A lockfile written by pnpm 11 is not readable by 8.15.9. [verified 2026-09-23]
5. Bumping `next` does not touch `@tailwindcss/postcss`'s own `postcss@8.5.8` copy, so two postcss advisories stay open on that path. Out of scope unless a `pnpm update` within the existing range clears them for free; record it either way. [verified 2026-09-23]

### Feasibility

2 SP is right: two version bumps, a lockfile regeneration, the standard gates, and a preview smoke. The only thing that could stretch it is gotcha 1, which the fallback bounds.

## Research Sources

- `pnpm@8.15.9 audit --json` on master 1a46e69 → 69 advisories (2 critical, 37 high, 26 moderate, 4 low); 30 on `next`; floors from `>=16.1.7` to `>=16.3.3`. [verified 2026-09-23]
- `npm view next@16` / `npm view next time` → 16.3.6 latest, released 2026-09-22; 16.3.3 released 2026-08-25; 16.2.11 released 2026-07-21. `npm view next@16.3.6` → peers `react ^18.2.0 || ^19.0.0`, depends on `postcss 8.5.23`, optional `sharp ^0.35.4`. `npm view eslint-config-next@16.3.6` → peers `eslint >=9.0.0`. `npm view sharp time` → 0.35.4 released 2026-08-26. [verified 2026-09-23]
- firecrawl_scrape https://nextjs.org/blog/next-16-3 → 16.3 features (prefetch bundling, build disk cache, TypeScript 7 option, opt-in Instant Navigations); no breaking changes to proxy, cookies, server actions or route handlers. [verified 2026-09-23]
- firecrawl_scrape https://nextjs.org/blog/next-16-2 → 16.2 features only; no breaking changes listed. [verified 2026-09-23]
- firecrawl_search "Next.js 16.3 release breaking changes" → https://nextjs.org/blog/next-16 → the 16.0 breaking-change table (async request APIs, proxy rename, Turbopack default), which the app already satisfies. [verified 2026-09-23]
- firecrawl_scrape https://github.com/vercel/next.js/discussions/95130 → with `sharp ^0.35.3` on 16.3.0, Vercel production functions failed at module load (`reading 'output'`); downgrading `sharp` to 0.34.5 resolved it for the reporter. [verified 2026-09-23]
- firecrawl_scrape https://github.com/vercel/next.js/issues/96650 → same regression, closed for missing reproduction, no fix version recorded.
- firecrawl_search "GHSA-2xp9-vwfh-vxw4" → https://vercel.com/changelog/nextjs-august-2026-security-release → AVIF RCE via libheif; Vercel disabled AVIF optimization in its managed service; CVE-2026-75604 affects Windows-hosted servers. https://github.com/vercel/next.js/security/advisories/GHSA-2xp9-vwfh-vxw4 → root cause in libheif used by `sharp`.
- firecrawl_search "Next.js 16.1 security advisory CVE 2026" (BF-56 scout, same day) → https://github.com/advisories/GHSA-6gpp-xcg3-4w24 → CVE-2026-64642 affects `>=16.0.0 <16.2.11`.
- firecrawl_search "sharp 0.35.4 reading 'output' Vercel" → https://github.com/mario-andreschak/flujo/blob/15d019f7b952b2f2d3aea1197722ac8d9f520d7c/docs/audits/2026-09-16-project-audit.md → an independent audit on 2026-09-16 reached the same floor: Next at least 16.3.3 and `sharp` at least 0.35.4.
- Not run: Phase 2g literature search; a dependency bump carries no technique to ground.

## Acceptance criteria

- [ ] `next` and `eslint-config-next` at a 16.x release at or above 16.2.11, lockfile regenerated with pnpm 8.15.9.
- [ ] `eslint` 0 errors, `tsc --noEmit` clean, `next build` clean on the committed tree.
- [ ] Signed-in smoke on the branch preview passes (dashboard, project, form view, PDF, inspector portal), and signed-out `/dashboard` redirects to login.
- [ ] Audit output before and after is recorded here.
- [ ] Production deploy after merge reaches READY and the same signed-out redirect holds on production.

## Notes

- Merge before BF-56 starts building, so BF-56 is developed and verified on the patched framework.
