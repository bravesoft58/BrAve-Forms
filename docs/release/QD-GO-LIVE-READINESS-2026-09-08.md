# Q&D production launch readiness

Assessed: 2026-09-08T18:33:17Z. Repository HEAD: `f6492b9e3d0078da3d1f94d90f04aa9e320246be`, with pre-existing working-tree changes. This is a focused launch assessment, not a completed security audit or release verification stamp.

**Recommendation: hold the production rollout until the security, record-integrity, and operational gates below pass.** The application already has the main workflows. The next milestone should be a Q&D production release with controlled scope and fresh acceptance evidence.

Working scope: Q&D is the first production customer. Tim confirmed on 2026-09-08 that there is no offline requirement: the application requires an internet connection. Offline form completion, offline queues, and synchronization are outside the launch scope. Target date and initial user/project counts remain pending. Two organizations already exist in the shared production database, so tenant isolation cannot be deferred even if the first rollout is Q&D only.

## What was verified

| Area | Evidence and limits |
| --- | --- |
| Application baseline | Earlier in this session: production build and TypeScript checks passed; lint had 0 errors and 8 warnings. These checks do not establish workflow or security correctness. |
| Browser | Local login/password-recovery navigation worked. Tim's live Brave session reached authenticated Settings. No new form submissions or customer-data changes were made during this assessment. |
| Supabase | Read-only MCP connected as `supabase_read_only_user`. Metadata query found 2 organizations, 10 projects, and 0 projects without an organization. |
| Row-level security | All public base tables have RLS enabled. Actual policies and privileges still require negative tests; enabled RLS alone is insufficient. |
| Storage | Both `form-attachments` and `project-documents` are private in the live database. Limits are 10 MiB for photos and 25 MiB for documents, with MIME allowlists. The sprint README still labels BF-32 NOT STARTED, so that status is stale. |
| Historical testing | BF-20 records 14/14 workflow checks passing on 2026-03-10. Later targeted UAT exists, including NDOT changes through June. This does not prove the current complete release after permission/storage changes. |
| Dependency audit | `pnpm audit --prod --json` on the current lockfile returned 41 advisories: 21 high, 16 moderate, 4 low, 0 critical. Counts are package/advisory findings, not 41 demonstrated application exploits. Full output: `C:/Users/Tim/AppData/Local/Temp/brave-readiness-dependency-audit.json`. |

## Launch blockers and required work

### 1. Protect privileges and organization boundaries — immediate

**Confirmed live configuration flaw:** the `authenticated` database role has UPDATE privilege on `profiles.role` and `profiles.platform_role`. The live `profiles_update_own` policy permits updating one's own profile. The only non-internal profile trigger is `profiles_updated_at`, which changes the timestamp; it does not protect privileges. The live `is_super_admin()` helper trusts `profiles.platform_role`.

Together these create a self-promotion path. The permissions, policy, trigger, and helper were read from production; an actual role change was deliberately not executed. This must be contained and corrected before expanding use.

**Tracked as [BF-59](../sprints/sprint-4-qd-go-live/stories/BF-59-profile-role-self-promotion.md) (2026-09-20).** The fix is migration `20260920194350_profile_role_guard.sql` (column privileges, guard trigger, policy WITH CHECK) with a paired rollback. On an isolated copy of production the self-promotion was reproduced (an ordinary user set `platform_role = 'super_admin'`, rolled back) and then denied after the migration; the negative suite is `Testing/security/bf59_profile_role_guard.sql`. Production apply status and the privileged-account review are recorded in the ticket.

Relevant source: [profile policy](../../supabase/migrations/20260430120000_multi_tenant_rls.sql), around lines 150–162 and 237–239. Live metadata is the stronger evidence.

Required work:

- Restrict ordinary profile updates to explicitly allowed personal fields. Protect role, platform role, organization association, and identity fields using reviewed database grants/policies or trusted trigger enforcement.
- Test direct database API requests from an ordinary user, not just hidden admin buttons. Prove self-promotion and cross-organization reads/writes are denied.
- Review existing privileged accounts and available logs for unexpected changes; this assessment has not established whether the flaw was used.
- Harden privileged server actions. [User management](../../src/app/dashboard/users/actions.ts), lines 13–18 and 153–200, checks global `profiles.role`, then uses a service client for target-account deletion or role changes without first proving that the target belongs to an organization administered by the caller. Add target-organization authorization and server-side input validation.
- Verify Q&D's established visibility model: organization-wide viewing, with ordinary users editing their own submissions and admins editing within their authorized organization. The shared direction log and May 4 UAT record explicitly approve this model (BF-42/BF-43); the old assigned-project-only requirement is superseded. This history was recovered during the September 8 EOD checkpoint and matches the live policies inspected today.
- Verify invitation, first login, password reset, deactivation, and session revocation with Q&D's actual email environment. Inspect production signup settings; the application has a public signup action.

Acceptance: ordinary user, Q&D admin, other-organization user/admin, platform admin, anonymous visitor, and inspector access tests pass across pages, server actions, direct data APIs, PDFs, and storage. No self-granted privileges or unauthorized access to another organization.

### 2. Patch the production dependency tree

The repository pins Next.js 16.1.6. The package audit identifies later security fixes, including Server Components denial-of-service issues. Maintainer advisories confirm affected ranges; applicability varies by enabled feature and hosting arrangement. Do not interpret the raw audit count as proof of exploitation.

- Upgrade to a currently supported patched Next.js release with compatible React and ESLint packages; update vulnerable transitive dependencies and the lockfile.
- Re-run the production audit and document the disposition of every remaining high/critical result.
- Align Node versions between local development, CI, and Vercel. Earlier checks found local Node 22.x pins while the Vercel project reports Node 24.x.
- Run the complete regression suite against the exact candidate commit and deployed preview.

Sources: [Next.js Server Components advisory](https://github.com/vercel/next.js/security/advisories/GHSA-8h8q-6873-q5fj), [Next.js proxy bypass follow-up](https://github.com/vercel/next.js/security/advisories/GHSA-26hh-7cqf-hhc6). These examples are not a complete upgrade target selection.

### 3. Make saving and historical records dependable

Code-confirmed patterns requiring correction or focused failure tests:

| Finding | Evidence | Required behavior |
| --- | --- | --- |
| Concurrent dust-log appends can overwrite one another | [Dust-log actions](../../src/app/dashboard/projects/[id]/forms/dust-log/actions.ts), lines 94–116, read the JSON array and write back a merged array without a version check or atomic append. | Atomic append or optimistic concurrency; two simultaneous writers preserve both changes or receive a clear conflict. |
| Project edits can partially erase permits/requirements | [Project actions](../../src/app/dashboard/projects/actions.ts), lines 235–279, delete existing rows before separate inserts. | Transactional update/reconciliation; injected failure leaves the prior valid project intact. |
| Removing a photo during editing deletes its stored object immediately | [PhotoAttachment](../../src/components/forms/shared/PhotoAttachment.tsx), around line 125, removes from Storage before the edited form is saved. | Canceling or failing an edit must preserve photos referenced by the saved submission. Stage deletions until a successful save and respect retention. |
| Date defaults mix UTC date with local time | [DailyDustLog](../../src/components/forms/dust-log/DailyDustLog.tsx), lines 27–30 and 62. | Project-local dates remain correct during Nevada evening hours, DST changes, and midnight boundaries. |
| PDF company field uses the project name | [PDF route](../../src/app/api/forms/[submissionId]/pdf/route.ts), line 106, passes `companyName: projectName`. | The exported company/contractor matches the saved form and intended organization. |
| Historical PDF headers use current project/permit data | The same PDF route queries current `projects` and `project_permits`. | Submitted records retain their original context. Later project edits do not silently rewrite historical document identity; amendments are attributable and versioned. |

These findings are based on code paths. Concurrent-save races, interrupted writes, and the photo-cancel sequence were not exercised against production.

The confirmed launch scope requires an internet connection. Offline completion, persistent offline queues, and synchronization are not launch requirements. Test ordinary online failure handling: slow requests, a connection dropping during save, expired sessions, and retries must produce clear save status, preserve entered values where recoverable, and prevent duplicate submissions. Warn before abandoning unsaved changes. The absence of an offline subsystem is not a launch gap.

Acceptance: saved records survive refresh/relogin, retries cannot duplicate submissions, failed saves preserve the last valid state, concurrent edits are handled, historical PDFs remain reproducible, and changes show who changed what and when. Agree record retention and signature requirements with Q&D's responsible owner.

### 4. Finish the Q&D form requirements and verify them on field devices

Triage the actual first-wave forms with Andy/Gracie. Existing pending stories include:

- BF-48: NDOT Contract # and CSW permit #.
- BF-49: choosing the required weekly stormwater form instead of automatically requiring both.
- BF-50: NDOT autofill, report numbering, and previous inspection date; depends on BF-48's data/props.
- BF-52: NNPH contact/description defaults and fill-material clarification.

These are not all equal launch blockers. Required field correctness and wrong form selection must be resolved for any form included in the release. Convenience autofill can be deferred if manual entry is correct and Q&D explicitly accepts it. Keep old submissions compatible while making changes.

Test the five form types that ship: Daily Dust Log, NDEP Stormwater, NDOT Stormwater, NDEP SAD, and NNPH Dust Permit. For each, verify entry, validation, save, history, allowed correction, Use Previous, print/PDF, and inspector presentation. Compare the rendered web and PDF outputs to the currently accepted source forms with Q&D; this assessment does not certify regulatory compliance.

Run on actual Q&D phones/tablets as well as desktop: portrait/landscape, touch input, photos, large documents, long comments, page breaks, readable signatures, and weak connectivity. Inspector checks include no-login access, invalid/expired/revoked QR links, project isolation, and signed-file URL expiry.

Acceptance: automated regressions pass first, then Andy/Gracie sign off the exact release on representative projects and field devices. Carry every deferred item in an explicit accepted list.

### 5. Establish release, recovery, and support operations

No application test runner, test script, or GitHub Actions workflow was found in this checkout. Add meaningful automated coverage and required CI checks for lint, types, build, authorization, critical workflows, and dependency scanning. Verify repository branch protection and deployment rules separately; their absence in source does not prove they are disabled remotely.

- Create an isolated test environment with synthetic data and a separate database/storage boundary. The current local app points to production Supabase, so a localhost test can change production records.
- Tie the release to a reviewed commit, migrations, preview evidence, approval, and a rehearsed rollback. Preserve the existing working tree while preparing release branches.
- Configure and verify error reporting, uptime checks, failed-save/auth-email alerts, useful server logs without form contents/secrets, capacity alerts, and a named responder. No application monitoring integration was found in source; external monitoring configuration remains unverified.
- Check production plan/capacity, domain and TLS, auth redirect URLs, custom SMTP and delivery, staff access/MFA, renewal ownership, quotas, and billing continuity. Verify rather than assume these are absent.
- Define an acceptable recovery window and maximum data loss. Verify scheduled database backups and separately protected uploaded files, then restore a project and its photos/documents into an isolated environment and measure recovery.
- Agree support hours, incident escalation, onboarding/offboarding, short user instructions, and a temporary operational fallback during an outage.

Supabase explicitly states that database backups contain Storage metadata, not the uploaded objects. A database-only backup is insufficient for this application. See [backup scope](https://supabase.com/docs/guides/platform/backups). Its [production checklist](https://supabase.com/docs/guides/deployment/going-into-prod) also covers RLS review, custom SMTP, availability, and load testing.

Acceptance: a restore drill and deployment rollback succeed, actionable test alerts reach the designated responder, invite/reset delivery works for Q&D, and expected launch load passes in staging without lost or duplicated records.

## Recommended execution order

1. Contain and fix privilege escalation; review privileged-account integrity. Establish the isolated test environment.
2. Patch dependencies and harden organization-scoped admin actions. Add the security regression suite and CI gate.
3. Fix record-integrity defects and the first-wave form blockers. Add workflow, concurrency, failure, and PDF regression tests.
4. Complete backup/restore, monitoring, email, deployment, load, and field-device checks.
5. Run a supervised pilot on a small set of Q&D projects through at least one complete daily/weekly reporting cycle. Keep the agreed fallback available, reconcile records daily, and expand only after the exit criteria pass.

Work on broad organization-switcher UX and other roadmap conveniences can be deferred unless required for safe administration of the actual production users. Correct authorization is mandatory now.

## Go/no-go record required for release

- [x] Connectivity scope agreed: Tim confirmed no offline requirement on 2026-09-08; an internet connection is required.
- [x] Existing visibility decision recovered: organization-wide viewing; own-submission edits for ordinary users; authorized-admin edits within the organization (BF-42/BF-43, May 4 UAT). Runtime regression remains required.
- [ ] Remaining release scope, users/projects, date, record retention, and support owner agreed.
- [ ] No open critical/high security exposure affecting the release; remaining audit findings have documented dispositions.
- [ ] Ordinary-user privilege and cross-organization denial tests pass.
- [ ] No open record-loss, incorrect-record, or critical workflow defect in the release scope.
- [ ] Automated regression suite passes on the exact release candidate; required CI gates are active.
- [ ] Q&D accepts web forms, PDFs, inspector flow, and actual field-device behavior.
- [ ] Database and file restore, deployment rollback, monitoring alerts, and email delivery are demonstrated.
- [ ] Pilot completes its reporting cycle without unexplained missing/duplicate records or unresolved critical failures.
- [ ] Tim approves release using the normal verify/closeout process; this assessment is not a PASS stamp.

Do not promise a release date until the immediate security fix, scope decisions, and first staging regression pass establish the remaining work. No production configuration, account, form, or deployment was modified in this assessment.
