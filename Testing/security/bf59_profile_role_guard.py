"""BF-59 negative suite (REST level). Proves through the public data API, with a real session,
that an ordinary user cannot promote themselves. Companion to bf59_profile_role_guard.sql, which
proves the same at the SQL level without needing credentials.

Usage:
  python Testing/security/bf59_profile_role_guard.py --email <ordinary-user> --password <pw> [--url ... --anon-key ...]
URL and anon key default to NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY from .env.local.
The account must be an ordinary member (profiles.role = 'user', platform_role = 'member').

The only writes attempted are (a) forbidden updates, which must be rejected, and (b) an update of
full_name to its current value. Exit code 1 on any failure. Never prints tokens or keys.
"""
import argparse, json, os, sys, urllib.request, urllib.error

def load_env():
    env = {}
    p = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env.local")
    if os.path.exists(p):
        for line in open(p, encoding="utf-8"):
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1); env[k.strip()] = v.strip().strip('"').strip("'")
    return env

def call(method, url, key, token=None, body=None, prefer=None):
    headers = {"apikey": key, "Authorization": f"Bearer {token or key}", "Content-Type": "application/json"}
    if prefer: headers["Prefer"] = prefer
    req = urllib.request.Request(url, method=method, headers=headers, data=json.dumps(body).encode() if body is not None else None)
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            raw = r.read().decode("utf-8", "replace")
            return r.status, (json.loads(raw) if raw else None)
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", "replace")
        try: return e.code, json.loads(raw)
        except Exception: return e.code, raw

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--email", required=True); ap.add_argument("--password", required=True)
    ap.add_argument("--url"); ap.add_argument("--anon-key")
    a = ap.parse_args()
    env = load_env()
    url = (a.url or env.get("NEXT_PUBLIC_SUPABASE_URL", "")).rstrip("/")
    key = a.anon_key or env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")
    if not url or not key:
        print("missing url or anon key"); sys.exit(2)

    st, tok = call("POST", f"{url}/auth/v1/token?grant_type=password", key, body={"email": a.email, "password": a.password})
    if st != 200 or not isinstance(tok, dict) or "access_token" not in tok:
        print(f"sign-in failed: HTTP {st}"); sys.exit(2)
    token, me = tok["access_token"], tok["user"]["id"]

    st, before = call("GET", f"{url}/rest/v1/profiles?id=eq.{me}&select=id,email,full_name,role,platform_role", key, token)
    if st != 200 or not before:
        print(f"cannot read own profile: HTTP {st}"); sys.exit(2)
    before = before[0]
    if before["role"] != "user" or before["platform_role"] != "member":
        print(f"account is not an ordinary member (role={before['role']}, platform_role={before['platform_role']}); pick another"); sys.exit(2)

    st, others = call("GET", f"{url}/rest/v1/profiles?id=neq.{me}&select=id&limit=1", key, token)
    other = others[0]["id"] if st == 200 and others else None

    results, fails = [], 0
    def record(tid, desc, ok, detail):
        nonlocal fails
        results.append((tid, desc, "PASS" if ok else "FAIL", detail)); fails += (0 if ok else 1)

    forbidden = [("R01", {"platform_role": "super_admin"}), ("R02", {"role": "admin"}), ("R04", {"email": "bf59@example.invalid"})]
    if other: forbidden.insert(2, ("R03", {"id": other}))
    for tid, body in forbidden:
        st, resp = call("PATCH", f"{url}/rest/v1/profiles?id=eq.{me}", key, token, body, prefer="return=representation")
        code = resp.get("code") if isinstance(resp, dict) else None
        record(tid, f"PATCH own row {list(body)[0]}", st in (401, 403) and code == "42501", f"HTTP {st} code={code}")

    st, resp = call("PATCH", f"{url}/rest/v1/profiles?id=eq.{me}", key, token, {"full_name": before["full_name"]}, prefer="return=representation")
    record("R05", "PATCH own row full_name (allowed column)", st == 200 and isinstance(resp, list) and len(resp) == 1, f"HTTP {st} rows={len(resp) if isinstance(resp, list) else 'n/a'}")

    if other:
        st, resp = call("PATCH", f"{url}/rest/v1/profiles?id=eq.{other}", key, token, {"full_name": "x"}, prefer="return=representation")
        record("R06", "PATCH another user's row (RLS)", st in (200, 204) and (resp == [] or resp is None), f"HTTP {st} rows={len(resp) if isinstance(resp, list) else 'n/a'}")

    st, after = call("GET", f"{url}/rest/v1/profiles?id=eq.{me}&select=id,email,full_name,role,platform_role", key, token)
    record("R07", "own row unchanged after probes", st == 200 and after and after[0] == before, json.dumps({k: after[0].get(k) for k in ("role", "platform_role")}) if after else f"HTTP {st}")

    for r in results: print(f"{r[0]}  {r[2]}  {r[1]}  [{r[3]}]")
    print(f"RESULT: {'PASS' if fails == 0 else str(fails) + ' FAIL'} ({len(results)} checks, user {a.email})")
    sys.exit(1 if fails else 0)

if __name__ == "__main__":
    main()
