"""BF-59 negative suite (REST level). Proves through the public data API, with a real session,
that an ordinary user cannot promote themselves. Companion to bf59_profile_role_guard.sql, which
proves the same at the SQL level without needing credentials and is the preferred production check.

Target contract (verify round 2, Codex finding):
  * The target is ALWAYS explicit: --url and --anon-key are required. Nothing is read from .env.local,
    so the script cannot be pointed at production by accident.
  * The production project ref is refused unless --allow-production is passed. Run it there only
    after the migration is applied.
  * Every forbidden probe is followed by a re-read of the row. If the field changed, whether the PATCH
    returned success, an error, or timed out with the write already committed, the script restores
    the pre-probe value (for the id column it targets the new id) and reports the breach loudly.
  * The cross-user probe writes the other user's CURRENT full_name back to them, never a literal,
    so a broken-RLS target is not corrupted by the detector.

Usage:
  python Testing/security/bf59_profile_role_guard.py --url https://<ref>.supabase.co --anon-key <key> \
      --email <ordinary-user> --password <pw> [--allow-production] [--timeout 30]
The account must be an ordinary member (profiles.role = 'user', platform_role = 'member').
Exit 0 on all PASS, 1 on any FAIL or breach, 2 on setup errors. Never prints tokens or keys.
Self-test without credentials: python Testing/security/bf59_rest_stub_test.py
"""
import argparse, json, socket, sys, urllib.request, urllib.error

PRODUCTION_REF = "ytsghlfjgdhczfbggpdl"
SELECT = "id,email,full_name,role,platform_role"


def call(method, url, key, token=None, body=None, prefer=None, timeout=30):
    """Returns (status, payload). status is None when no HTTP response arrived (timeout, network)."""
    headers = {"apikey": key, "Authorization": f"Bearer {token or key}", "Content-Type": "application/json"}
    if prefer:
        headers["Prefer"] = prefer
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, method=method, headers=headers, data=data)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            raw = r.read().decode("utf-8", "replace")
            return r.status, (json.loads(raw) if raw else None)
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", "replace")
        try:
            return e.code, json.loads(raw)
        except Exception:
            return e.code, raw
    except (urllib.error.URLError, socket.timeout, TimeoutError, OSError) as e:
        return None, f"{type(e).__name__}: {e}"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", required=True)
    ap.add_argument("--anon-key", required=True)
    ap.add_argument("--email", required=True)
    ap.add_argument("--password", required=True)
    ap.add_argument("--allow-production", action="store_true")
    ap.add_argument("--timeout", type=float, default=30)
    a = ap.parse_args()
    url, key, tmo = a.url.rstrip("/"), a.anon_key, a.timeout
    if PRODUCTION_REF in url and not a.allow_production:
        print("refusing to run against the production project without --allow-production")
        sys.exit(2)

    st, tok = call("POST", f"{url}/auth/v1/token?grant_type=password", key, body={"email": a.email, "password": a.password}, timeout=tmo)
    if st != 200 or not isinstance(tok, dict) or "access_token" not in tok:
        print(f"sign-in failed: HTTP {st}")
        sys.exit(2)
    token, me = tok["access_token"], tok["user"]["id"]

    def read_row(row_id):
        st, rows = call("GET", f"{url}/rest/v1/profiles?id=eq.{row_id}&select={SELECT}", key, token, timeout=tmo)
        return rows[0] if st == 200 and isinstance(rows, list) and rows else None

    before = read_row(me)
    if not before:
        print("cannot read own profile")
        sys.exit(2)
    if before["role"] != "user" or before["platform_role"] != "member":
        print(f"account is not an ordinary member (role={before['role']}, platform_role={before['platform_role']}); pick another")
        sys.exit(2)

    st, others = call("GET", f"{url}/rest/v1/profiles?id=neq.{me}&select={SELECT}&limit=1", key, token, timeout=tmo)
    other = others[0] if st == 200 and isinstance(others, list) and others else None

    results, fails, breach = [], 0, False

    def record(tid, desc, ok, detail):
        nonlocal fails
        results.append((tid, desc, "PASS" if ok else "FAIL", detail))
        fails += 0 if ok else 1

    forbidden = [("R01", "platform_role", "super_admin"), ("R02", "role", "admin"), ("R04", "email", "bf59@example.invalid")]
    if other:
        forbidden.insert(2, ("R03", "id", other["id"]))
    for tid, field, value in forbidden:
        st, resp = call("PATCH", f"{url}/rest/v1/profiles?id=eq.{me}", key, token, {field: value}, prefer="return=representation", timeout=tmo)
        code = resp.get("code") if isinstance(resp, dict) else None
        rejected = st in (401, 403) and code == "42501"
        record(tid, f"PATCH own row {field}", rejected, f"HTTP {st} code={code}" if st is not None else f"no response ({resp})")
        # Re-read regardless of what the response said: a timed-out write may have committed.
        if field == "id":
            # A committed id change moves MY row to the new id. Reading the new id alone is not enough:
            # on a healthy target that id belongs to the other user, so confirm by email.
            own = read_row(me)
            moved = read_row(value)
            changed = own is None and moved is not None and moved.get("email") == before["email"]
            where = value
        else:
            own = read_row(me)
            changed = own is not None and own.get(field) != before.get(field)
            where = me
        if changed:
            breach = True
            rst, _ = call("PATCH", f"{url}/rest/v1/profiles?id=eq.{where}", key, token, {field: before[field]}, prefer="return=representation", timeout=tmo)
            restored = read_row(me)
            ok = restored is not None and restored.get(field) == before.get(field)
            record(tid + "!", f"BREACH: {field} write was NOT blocked; restore attempted", ok, f"restore HTTP {rst}, now {restored.get(field) if restored else 'unreadable'}")

    st, resp = call("PATCH", f"{url}/rest/v1/profiles?id=eq.{me}", key, token, {"full_name": before["full_name"]}, prefer="return=representation", timeout=tmo)
    record("R05", "PATCH own row full_name (allowed column)", st == 200 and isinstance(resp, list) and len(resp) == 1, f"HTTP {st} rows={len(resp) if isinstance(resp, list) else 'n/a'}")

    if other:
        # Same-value write: proves RLS hides the row (0 rows) without ever corrupting it.
        st, resp = call("PATCH", f"{url}/rest/v1/profiles?id=eq.{other['id']}", key, token, {"full_name": other["full_name"]}, prefer="return=representation", timeout=tmo)
        record("R06", "PATCH another user's row (RLS, same value)", st in (200, 204) and (resp == [] or resp is None), f"HTTP {st} rows={len(resp) if isinstance(resp, list) else 'n/a'}")

    after = read_row(me)
    record("R07", "own row unchanged after probes", after == before, json.dumps({k: after.get(k) for k in ("role", "platform_role", "email")}) if after else "unreadable")

    for r in results:
        print(f"{r[0]}  {r[2]}  {r[1]}  [{r[3]}]")
    if breach:
        print("CRITICAL: at least one forbidden write was ACCEPTED. The self-promotion hole is OPEN on this target. Restores were attempted above; verify the row manually.")
    print(f"RESULT: {'PASS' if fails == 0 else str(fails) + ' FAIL'} ({len(results)} checks, user {a.email})")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
