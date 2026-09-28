/**
 * BF-65 + BF-61 unit checks: key-order-insensitive comparison, the
 * insert-once and update-if-unchanged decisions (driven by a stub Supabase
 * client that records every filter), key/version parsing, and the submit hook
 * attaching one key per mounted form. No network, no database.
 *   node --import ./Testing/forms/ts-alias-hooks.mjs Testing/forms/bf65_record_integrity_test.ts
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { sameData } from "@/lib/forms/same-data";
import {
  ALREADY_SAVED_ERROR,
  CONFLICT_ERROR,
  DUPLICATE_KEY_INDEX,
  FORBIDDEN_ERROR,
  insertSubmissionOnce,
  readClientKey,
  readVersion,
  updateSubmissionIfUnchanged,
} from "@/lib/forms/submission-writes";
import { buildNoResetSubmit } from "@/lib/forms/no-reset-submit";
import { catchLostReply, LOST_REPLY_ERROR } from "@/lib/forms/lost-reply";

type Reply = { data?: unknown; error?: { code?: string; message: string } | null };
type Call = { table: string; op: string; payload?: unknown; filters: Record<string, unknown> };

/** A chainable stand-in for supabase-js: records each query, answers from a script in order. */
function stubClient(replies: Reply[]) {
  const calls: Call[] = [];
  const client = {
    from(table: string) {
      const call: Call = { table, op: "select", filters: {} };
      calls.push(call);
      const next = () => Promise.resolve({ data: null, error: null, ...replies.shift() });
      const builder = {
        insert: (payload: unknown) => ((call.op = "insert"), (call.payload = payload), builder),
        update: (payload: unknown) => ((call.op = "update"), (call.payload = payload), builder),
        select: () => builder,
        eq: (column: string, value: unknown) => ((call.filters[column] = value), builder),
        single: next,
        maybeSingle: next,
      };
      return builder;
    },
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { client: client as any, calls };
}

const KEY = "0b8f7a8e-4c2d-4e1f-9a3b-5c6d7e8f9a0b";
const USER = "user-1";
const VERSION = "2026-09-28T16:02:45.406123+00:00"; // microseconds: must reach the filter untouched
const row = {
  project_id: "p1",
  form_type: "working_in_waterways",
  form_date: "2026-09-28",
  submitted_by: USER,
  data: { site_name: "Western Drainage", checks: [1, 2], photos: [{ file_name: "a.jpg", caption: undefined }] },
};
// The same record as Postgres jsonb hands it back: different key order, undefined dropped.
const storedData = { photos: [{ file_name: "a.jpg" }], checks: [1, 2], site_name: "Western Drainage" };
const duplicate = { code: "23505", message: `duplicate key value violates unique constraint "${DUPLICATE_KEY_INDEX}"` };

test("sameData ignores key order but not values or array order", () => {
  assert.ok(sameData({ a: 1, b: { c: [1, { d: 2 }] } }, { b: { c: [1, { d: 2 }] }, a: 1 }));
  assert.ok(!sameData({ a: 1, b: 2 }, { a: 1, b: 3 }));
  assert.ok(!sameData([1, 2], [2, 1]));
  assert.ok(!sameData({ a: 1 }, { a: 1, b: undefined }));
  assert.ok(!sameData({ a: null }, { a: {} }));
});

test("readClientKey accepts a UUID only; readVersion keeps the database text exactly", () => {
  const fd = new FormData();
  assert.equal(readClientKey(fd), null);
  fd.set("client_key", "not-a-uuid");
  assert.equal(readClientKey(fd), null);
  fd.set("client_key", KEY);
  assert.equal(readClientKey(fd), KEY);
  fd.set("version", VERSION);
  assert.equal(readVersion(fd), VERSION);
});

test("insert without a key inserts as before", async () => {
  const { client, calls } = stubClient([{ data: { id: "new-1" } }]);
  assert.deepEqual(await insertSubmissionOnce(client, row, null), { ok: true, id: "new-1", replay: false });
  assert.equal(calls.length, 1);
  assert.equal((calls[0].payload as { client_key: unknown }).client_key, null);
});

test("a retry whose first attempt committed returns the first row's id, not a new row", async () => {
  const { client, calls } = stubClient([{ error: duplicate }, { data: { id: "first-1", ...row, data: storedData } }]);
  assert.deepEqual(await insertSubmissionOnce(client, row, KEY), { ok: true, id: "first-1", replay: true });
  assert.equal((calls[0].payload as { client_key: unknown }).client_key, KEY);
  // The lookup is scoped to this user and this key.
  assert.deepEqual(calls[1].filters, { submitted_by: USER, client_key: KEY });
});

test("the same key with different content is refused, never treated as saved", async () => {
  const changed = { ...storedData, site_name: "Eastern Drainage" };
  const { client } = stubClient([{ error: duplicate }, { data: { id: "first-1", ...row, data: changed } }]);
  assert.deepEqual(await insertSubmissionOnce(client, row, KEY), { ok: false, error: ALREADY_SAVED_ERROR });

  const otherProject = stubClient([{ error: duplicate }, { data: { id: "first-1", ...row, project_id: "p2", data: storedData } }]);
  assert.deepEqual(await insertSubmissionOnce(otherProject.client, row, KEY), { ok: false, error: ALREADY_SAVED_ERROR });
});

test("a unique violation on some other constraint is reported as is, with no lookup", async () => {
  const other = { code: "23505", message: 'duplicate key value violates unique constraint "form_submissions_pkey"' };
  const { client, calls } = stubClient([{ error: other }]);
  assert.deepEqual(await insertSubmissionOnce(client, row, KEY), { ok: false, error: other.message });
  assert.equal(calls.length, 1);
});

const target = { id: "s1", project_id: "p1", form_type: "working_in_waterways" };
const patch = { data: row.data, form_date: "2026-09-28" };

test("an unchanged row is updated, guarded by the exact loaded version", async () => {
  const { client, calls } = stubClient([{ data: { id: "s1" } }]);
  assert.deepEqual(await updateSubmissionIfUnchanged(client, target, patch, VERSION), { ok: true, id: "s1", replay: false });
  assert.equal(calls[0].filters.updated_at, VERSION);
});

test("someone else saved first: conflict, and the message differs from a permission refusal", async () => {
  const { client } = stubClient([
    { data: null },
    { data: { updated_at: "2026-09-28T16:05:00.1+00:00", form_date: "2026-09-28", data: { ...storedData, site_name: "Other" } } },
  ]);
  const result = await updateSubmissionIfUnchanged(client, target, patch, VERSION);
  assert.deepEqual(result, { ok: false, error: CONFLICT_ERROR });
  assert.notEqual(CONFLICT_ERROR, FORBIDDEN_ERROR);
});

test("zero rows with the version unchanged is a permission refusal, not a conflict", async () => {
  const { client } = stubClient([{ data: null }, { data: { updated_at: VERSION, form_date: "2026-09-28", data: storedData } }]);
  assert.deepEqual(await updateSubmissionIfUnchanged(client, target, patch, VERSION), { ok: false, error: FORBIDDEN_ERROR });

  const hidden = stubClient([{ data: null }, { data: null }]);
  assert.deepEqual(await updateSubmissionIfUnchanged(hidden.client, target, patch, VERSION), { ok: false, error: FORBIDDEN_ERROR });
});

test("a retried edit whose first attempt landed succeeds instead of reporting a conflict", async () => {
  const { client } = stubClient([
    { data: null },
    { data: { updated_at: "2026-09-28T16:05:00.1+00:00", form_date: "2026-09-28", data: storedData } },
  ]);
  assert.deepEqual(await updateSubmissionIfUnchanged(client, target, patch, VERSION), { ok: true, id: "s1", replay: true });
});

test("without a version the update runs unguarded, as before", async () => {
  const { client, calls } = stubClient([{ data: null }]);
  assert.deepEqual(await updateSubmissionIfUnchanged(client, target, patch, null), { ok: false, error: FORBIDDEN_ERROR });
  assert.equal("updated_at" in calls[0].filters, false);
  assert.equal(calls.length, 1);
});

test("the submit hook sends one key for every retry of a mounted form, and a new form gets a new key", () => {
  const makeKeyProvider = () => {
    let key: string | null = null;
    return () => (key ??= crypto.randomUUID());
  };
  const run = (provider: () => string) => {
    const sent: string[] = [];
    const handler = buildNoResetSubmit(
      (fd: FormData) => sent.push(String(fd.get("client_key"))),
      (fn: () => void) => fn(),
      () => new FormData(),
      provider,
    );
    const event = { preventDefault() {}, currentTarget: {} } as unknown as Parameters<typeof handler>[0];
    handler(event);
    handler(event);
    return sent;
  };
  const first = run(makeKeyProvider());
  assert.equal(first[0], first[1]);
  assert.match(first[0], /^[0-9a-f-]{36}$/);
  assert.notEqual(run(makeKeyProvider())[0], first[0]);
});

// Stands in for next/navigation's unstable_rethrow: re-raises Next's own control-flow errors.
const NEXT_REDIRECT = Object.assign(new Error("NEXT_REDIRECT"), { digest: "NEXT_REDIRECT;replace;/x;307;" });
const rethrowNext = (error: unknown) => {
  if ((error as { digest?: string })?.digest?.startsWith("NEXT_")) throw error;
};

test("a lost reply becomes an error on the form, keeping the earlier state, instead of a thrown error", async () => {
  const lost = catchLostReply(async () => {
    throw new TypeError("Failed to fetch");
  }, rethrowNext);
  const before = { error: "", fieldErrors: { site_name: ["x"] } };
  assert.deepEqual(await lost(before, new FormData()), { error: LOST_REPLY_ERROR, fieldErrors: { site_name: ["x"] } });
});

test("Next's redirect after a successful save still propagates, and a normal reply passes through", async () => {
  const redirecting = catchLostReply(async () => {
    throw NEXT_REDIRECT;
  }, rethrowNext);
  await assert.rejects(redirecting({ error: "" }, new FormData()), (e) => e === NEXT_REDIRECT);

  const refused = catchLostReply(async () => ({ error: "Please fix the errors below." }), rethrowNext);
  assert.deepEqual(await refused({ error: "" }, new FormData()), { error: "Please fix the errors below." });
});
