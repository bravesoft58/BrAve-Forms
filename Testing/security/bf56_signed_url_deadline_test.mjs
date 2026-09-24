/**
 * BF-56 verify round 3, finding 2: signed file URLs must never outlive the
 * inspector's access deadline, even when Storage signs late.
 *
 * Supabase stamps a signed URL's `exp` when its server signs it
 * (sign time + expiresIn), so latency between choosing the lifetime and the
 * signing call pushes `exp` later. This models that directly against the
 * real helpers in src/lib/inspector/signed-url-deadline.ts:
 *   - within the signing margin, exp never passes the deadline;
 *   - past it, signedUrlWithin rejects the link, so the portal drops it.
 * Pure, no network, no database. Needs Node 24 (runs the .ts by type stripping):
 *   npx --yes -p node@24 -c "node Testing/security/bf56_signed_url_deadline_test.mjs"
 */
import { signedUrlTtlSec, signedUrlWithin } from "../../src/lib/inspector/signed-url-deadline.ts";

let passed = 0;
let failed = 0;
function check(name, ok, detail = "") {
  if (ok) passed++;
  else failed++;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` -- ${detail}` : ""}`);
}

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const urlWithExp = (exp) =>
  `https://example.supabase.co/storage/v1/object/sign/form-attachments/p.jpg?token=${b64({ alg: "HS256" })}.${b64({ url: "p.jpg", exp })}.sig`;

const t0 = 1_800_000_000_000; // fixed clock (ms)
const t0s = t0 / 1000;

// Lifetime selection.
check("12 h left -> capped at 3600 s", signedUrlTtlSec(new Date(t0 + 12 * 3600e3), t0) === 3600);
check("120 s left -> 110 s (10 s signing margin)", signedUrlTtlSec(new Date(t0 + 120e3), t0) === 110);
check("11 s left -> 1 s", signedUrlTtlSec(new Date(t0 + 11e3), t0) === 1);
check("10.5 s left -> null (too close to sign safely)", signedUrlTtlSec(new Date(t0 + 10.5e3), t0) === null);
check("deadline passed -> null", signedUrlTtlSec(new Date(t0 - 1), t0) === null);

// Delayed signing: exp = sign time + ttl, sign time = t0 + latency.
for (const remaining of [120, 900, 3700]) {
  const deadline = new Date(t0 + remaining * 1000);
  const ttl = signedUrlTtlSec(deadline, t0);
  const inMargin = [0, 1, 5, 9.9].every((lat) => Math.floor(t0s + lat) + ttl <= deadline.getTime() / 1000);
  check(`${remaining} s left: signing up to 9.9 s late still expires by the deadline`, inMargin);
  const lateExp = Math.floor(t0s + 15) + ttl;
  const overrun = lateExp > deadline.getTime() / 1000;
  check(`${remaining} s left: 15 s late signing ${overrun ? "overruns and is rejected" : "stays inside"}`,
    overrun ? !signedUrlWithin(urlWithExp(lateExp), deadline) : signedUrlWithin(urlWithExp(lateExp), deadline),
    `exp - deadline = ${lateExp - deadline.getTime() / 1000} s`);
}

// signedUrlWithin boundaries and fail-closed parsing.
const d = new Date(t0 + 60e3);
check("exp exactly at deadline is accepted", signedUrlWithin(urlWithExp(t0s + 60), d));
check("exp 1 s past deadline is rejected", !signedUrlWithin(urlWithExp(t0s + 61), d));
check("null / empty URL is rejected", !signedUrlWithin(null, d) && !signedUrlWithin("", d));
check("URL without token is rejected", !signedUrlWithin("https://example.supabase.co/x?y=1", d));
check("malformed token is rejected", !signedUrlWithin("https://example.supabase.co/x?token=abc", d));
check("token without numeric exp is rejected", !signedUrlWithin(urlWithExp("soon"), d));

console.log(`RESULT: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
