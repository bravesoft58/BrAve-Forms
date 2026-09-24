# BF-62: Upgrade Next.js out of the 2026 advisory ranges, on Node 24 and pnpm 10

**Type:** Security upgrade (framework dependency) plus toolchain pin
**Priority:** HIGH (the dashboard's login redirect runs in `proxy.ts`)
**Points:** 3 (was 2; the Node 24 and pnpm 10 pins were added 2026-09-24)
**Status:** NOT STARTED
**Sprint:** 4
**Reported by:** BF-56 scout, 2026-09-23; Tim directed it into this sprint the same day
**Created:** 2026-09-23
**Last Updated:** 2026-09-24T13:29:47Z
**Blocks:** BF-56

## Decisions (Tim, 2026-09-24)

1. **Node 24, not 22.** The repo declares Node 24 (`.nvmrc` `24`, `engines.node` `24.x`). Production already runs 24 on Vercel, so this changes nothing in production; it makes the repo say what production runs. The fleet Node standard moved to 24 the same day (toolchain `0d49191`). Tim's June `engines: 22.x` line is replaced, not committed. `.nvmrc` is now committed (it was on the never-commit list).
2. **pnpm 10.34.5**, pinned with `packageManager`. It is the newest pnpm major Vercel installs from the lockfile without Corepack; 11 and 12 need Vercel's experimental Corepack switch. pnpm 10, 11 and 12 all write lockfile format `9.0`, so a later move to 11 or 12 is a one-line change. [verified 2026-09-24] Tim's June `pnpm@8.15.9` line is replaced.
3. **Two commits, two previews.** Commit A is the Node and pnpm pins plus the lockfile conversion, on the current Next 16.1.6; smoke its preview. Commit B is the Next.js bump; smoke again. If the `sharp` load failure (gotcha 1) appears, the preview that shows it identifies the cause.

## Problem

The repo pins `next` and `eslint-config-next` at 16.1.6. That version sits inside published advisory ranges that let a request bypass proxy logic, among 30 advisories on `next` in total. The ones that apply to this App Router app [verified 2026-09-23]:

- CVE-2026-44574 and CVE-2026-44575, fixed in 16.2.5. [verified 2026-09-23]
- CVE-2026-45109, fixed in 16.2.6. [verified 2026-09-23]
- CVE-2026-64642 / GHSA-6gpp-xcg3-4w24, proxy bypass in App Router apps using Turbopack with a single locale, affects `>=16.0.0 <16.2.11`, fixed in 16.2.11. [verified 2026-09-23]
- The two criticals need 16.3.3 or later (see Technical Approach). [verified 2026-09-23]

CVE-2026-44573, cited here before 2026-09-24, is Pages Router with i18n and does not apply.

`src/proxy.ts` redirects signed-out users away from `/dashboard`. Pages and server actions mostly re-check the user themselves, but the proxy is the first gate, and BF-56 adds a cookie-based inspector session that must not rest on a bypassable layer.

This also closes part of the "dependencies" readiness gate from the 2026-09-08 assessment. It does not attempt the rest of that gate's advisories.

## Scope

0. **Commit A (toolchain).**
   - `package.json`: `packageManager: "pnpm@10.34.5"` and `engines: {"node": "24.x"}`. Add `.nvmrc` containing `24`.
   - Convert `pnpm-lock.yaml` from format `6.0` to `9.0` with `npx --yes pnpm@10.34.5 install`, run against the existing lockfile. Never delete it and regenerate from scratch.
   - Diff the resolved versions: the conversion must not move any package version. If it does, stop and record it.
   - pnpm 10 skips dependency install scripts. Read its "ignored build scripts" warning and list the packages that need them (expect `sharp`, possibly `unrs-resolver` or `@tailwindcss/oxide`) under `pnpm.onlyBuiltDependencies`.
   - Local gates run on Node 24. Install Node 24 on the workstation first, or run under `npx --yes node@24`.
   - Push and smoke the preview. The build log must show pnpm 10 and Node 24.
1. **Commit B (framework).** Bump `next` and `eslint-config-next` to 16.3.6, the latest patch at scout time. Use a newer 16.3.x if one exists at build time, never below 16.3.3. Fallback per gotcha 1: the latest 16.2.x, never below 16.2.11. Check the React peer range and bump `react` and `react-dom` only if it requires. [verified 2026-09-23]
2. Update `pnpm-lock.yaml` with the pinned pnpm 10.34.5 (`npx --yes pnpm@10.34.5 install`), never a global pnpm. <!-- staleness-lint:ignore  repo-internal pin, not an outside-world claim -->
3. Read the Next.js release notes between 16.1.6 and the target for breaking changes that touch this app: `proxy.ts`, async `cookies()` / `params`, Route Handlers, server actions, image and font config. <!-- staleness-lint:ignore  repo-internal pin, not an outside-world claim -->
4. Run `eslint`, `tsc --noEmit`, `next build` on the final tree.
5. Smoke the upgraded preview while signed in: dashboard loads, one project page, one form view, one PDF download, the inspector portal from an existing QR code; signed out: `/dashboard` redirects to login.
6. Re-run `pnpm audit` (or the equivalent) and record which advisories remain, so the readiness gate has a current count.

## Out of scope

- pnpm 11 or 12 (they need Vercel's experimental Corepack switch; revisit when Vercel supports them natively).
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
2. **`package.json` carries Tim's uncommitted June edit on master.** The `packageManager: pnpm@8.15.9` and `engines.node: 22.x` lines exist only in the main working tree. Decided 2026-09-24: BF-62 replaces them with pnpm 10.34.5 and Node 24.x (see Decisions). At closeout, stash the June edit as usual. After the merge, drop the June `package.json` hunk rather than restoring it, because master now carries the replacement lines. [verified 2026-09-23]
3. **Node 24 is a no-op in production.** Vercel honours `engines.node` and production already runs 24.x, so the pin only makes it explicit. The workstation runs Node 22.23.2, so run the local gates on 24 (see Scope 0). [verified 2026-09-24]
4. **The lockfile changes format** from `6.0` (pnpm 8) to `9.0` (pnpm 10). Once it merges, pnpm 8 can no longer read the repo's lockfile. Any worktree recipe or script that says `pnpm@8.15.9` must move to `pnpm@10.34.5`, including the MEMORY recipe and the gotchas. [verified 2026-09-24]
5. Bumping `next` does not touch `@tailwindcss/postcss`'s own `postcss@8.5.8` copy, so two postcss advisories stay open on that path. Out of scope unless a `pnpm update` within the existing range clears them for free; record it either way. [verified 2026-09-23]

### Feasibility

Re-estimated at 3 SP on 2026-09-24. The scouted work was two version bumps, a lockfile regeneration, the standard gates and a preview smoke. Added since: the pnpm 10 lockfile conversion and its build-script allow-list, and a second preview. The only thing that could stretch it is gotcha 1, which the fallback bounds.

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
- 2026-09-24, toolchain decision:
  - https://raw.githubusercontent.com/nodejs/Release/main/schedule.json: Node 22 has been in maintenance since 2025-10-21 and reaches end of life 2027-04-30. Node 24 is Active LTS until 2026-10-20 and reaches end of life 2028-04-30.
  - https://nodejs.org/dist/index.json: v24.21.0 (2026-09-07) bundles npm 11.19.0.
  - https://vercel.com/docs/functions/runtimes/node-js/node-js-versions: 24.x is the default. 22.x and 20.x are still available, and 20 is deprecated on 2026-10-01. `engines.node` overrides the project setting.
  - https://vercel.com/docs/package-managers: native pnpm support is 6 to 10. Lockfile `9.0` maps to pnpm 9 or 10. Other versions need Corepack.
  - `npm view pnpm dist-tags`: latest 12.6.0, 11.27.1, 10.34.5 (released 2026-07-10), 9.15.9, 8.15.9.
  - A lockfile probe: pnpm 10.34.5, 11.27.1 and 12.6.0 each write `lockfileVersion: '9.0'`. [verified 2026-09-24]
- Not run: Phase 2g literature search; a dependency bump carries no technique to ground.

## Acceptance criteria

- [ ] `package.json` declares `packageManager: pnpm@10.34.5` and `engines.node: 24.x`, and `.nvmrc` is `24`.
- [ ] The lockfile is converted to format `9.0` with no package version changes in commit A. Vercel's build log shows pnpm 10 and Node 24.
- [ ] Commit A's preview passes the same smoke as below before commit B lands.
- [ ] `next` and `eslint-config-next` are at 16.3.3 or later, or at 16.2.11 or later under the gotcha-1 fallback with the reason recorded. The lockfile is updated with pnpm 10.34.5.
- [ ] `eslint` 0 errors, `tsc --noEmit` clean, `next build` clean on the committed tree.
- [ ] Signed-in smoke on the branch preview passes (dashboard, project, form view, PDF, inspector portal), and signed-out `/dashboard` redirects to login.
- [ ] Audit output before and after is recorded here.
- [ ] Production deploy after merge reaches READY and the same signed-out redirect holds on production.

## Notes

- Merge before BF-56 starts building, so BF-56 is developed and verified on the patched framework.
