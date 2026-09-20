"""Executable self-test for bf59_profile_role_guard.py using an in-process stub of the Supabase API.
No credentials, no network. Three scenarios:

  patched  - forbidden PATCHes return 403/42501 (production after BF-59). Expect exit 0, all PASS,
             state untouched.
  open     - forbidden PATCHes are accepted (unpatched target). Expect exit 1, BREACH lines, and the
             stub's state restored to its initial values by the script (including the id case).
  timeout  - the first forbidden PATCH commits but the response hangs past the client timeout.
             Expect the script to detect the committed write on re-read and restore it.

Run: python Testing/security/bf59_rest_stub_test.py
"""
import copy, json, os, subprocess, sys, threading, time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs

HERE = os.path.dirname(os.path.abspath(__file__))
SCRIPT = os.path.join(HERE, "bf59_profile_role_guard.py")
ME, OTHER = "11111111-1111-1111-1111-111111111111", "22222222-2222-2222-2222-222222222222"
INITIAL = {
    ME: {"id": ME, "email": "member@example.invalid", "full_name": "Member One", "role": "user", "platform_role": "member"},
    OTHER: {"id": OTHER, "email": "other@example.invalid", "full_name": "Other Two", "role": "admin", "platform_role": "member"},
}
FORBIDDEN = {"role", "platform_role", "id", "email"}


class Stub:
    def __init__(self, mode):
        self.mode, self.rows, self.hung = mode, copy.deepcopy(INITIAL), False
        self.me_id = ME  # the caller's row id; follows the row if an id write is accepted


def make_handler(stub):
    class H(BaseHTTPRequestHandler):
        def log_message(self, *a):
            pass

        def _send(self, code, payload):
            body = json.dumps(payload).encode()
            self.send_response(code)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def _filter(self, qs):
            f = qs.get("id", [""])[0]
            if f.startswith("eq."):
                return [r for r in stub.rows.values() if r["id"] == f[3:]]
            if f.startswith("neq."):
                return [r for r in stub.rows.values() if r["id"] != f[4:]]
            return list(stub.rows.values())

        def do_POST(self):
            if self.path.startswith("/auth/v1/token"):
                return self._send(200, {"access_token": "stub-token", "user": {"id": ME}})
            self._send(404, {})

        def do_GET(self):
            u = urlparse(self.path)
            if u.path == "/rest/v1/profiles":
                rows = self._filter(parse_qs(u.query))
                # RLS: the caller (ME) sees self and co-org members; both rows visible here.
                return self._send(200, rows)
            self._send(404, {})

        def do_PATCH(self):
            u = urlparse(self.path)
            n = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(n) or b"{}")
            # RLS own-row policy: only the caller's current row is updatable; others yield 0 rows.
            rows = [r for r in self._filter(parse_qs(u.query)) if r["id"] == stub.me_id]
            forbidden = FORBIDDEN & set(body)
            if forbidden and stub.mode == "patched":
                return self._send(403, {"code": "42501", "message": "permission denied for table profiles"})
            new_id = body.get("id")
            if rows and new_id and new_id != stub.me_id and new_id in stub.rows:
                # Postgres would reject the primary-key collision even on an unpatched target.
                return self._send(409, {"code": "23505", "message": "duplicate key value violates unique constraint"})
            hang = bool(forbidden) and stub.mode == "timeout" and not stub.hung
            for r in rows:
                old_id = r["id"]
                r.update(body)
                if r["id"] != old_id:
                    stub.rows[r["id"]] = stub.rows.pop(old_id)
                    if old_id == stub.me_id:
                        stub.me_id = r["id"]
            if hang:
                stub.hung = True
                time.sleep(4)  # longer than the client's --timeout in this test; the write is already committed
                return
            self._send(200, rows)

    return H


def run_scenario(mode):
    stub = Stub(mode)
    srv = ThreadingHTTPServer(("127.0.0.1", 0), make_handler(stub))
    port = srv.server_address[1]
    t = threading.Thread(target=srv.serve_forever, daemon=True)
    t.start()
    try:
        p = subprocess.run([sys.executable, SCRIPT, "--url", f"http://127.0.0.1:{port}", "--anon-key", "stub", "--email", INITIAL[ME]["email"], "--password", "x", "--timeout", "1.5"],
                           capture_output=True, text=True, timeout=120)
    finally:
        srv.shutdown()
    return p, stub


def main():
    failures = 0
    for mode, want_exit, want_breach in (("patched", 0, False), ("open", 1, True), ("timeout", 1, True)):
        p, stub = run_scenario(mode)
        restored = stub.rows == INITIAL
        got_breach = "CRITICAL" in p.stdout
        ok = (p.returncode == want_exit) and (got_breach == want_breach) and restored
        failures += 0 if ok else 1
        print(f"[{mode:8}] exit={p.returncode} (want {want_exit})  breach_line={got_breach} (want {want_breach})  state_restored={restored}  -> {'PASS' if ok else 'FAIL'}")
        if not ok:
            print("   --- script stdout ---")
            print("   " + p.stdout.replace("\n", "\n   "))
            print("   --- stub rows ---")
            print("   " + json.dumps(stub.rows))
    # production-ref refusal
    p = subprocess.run([sys.executable, SCRIPT, "--url", "https://ytsghlfjgdhczfbggpdl.supabase.co", "--anon-key", "x", "--email", "a", "--password", "b"], capture_output=True, text=True)
    ok = p.returncode == 2 and "refusing" in p.stdout
    failures += 0 if ok else 1
    print(f"[refusal ] exit={p.returncode} (want 2)  message={'refusing' in p.stdout}  -> {'PASS' if ok else 'FAIL'}")
    print(f"RESULT: {'PASS' if failures == 0 else str(failures) + ' FAIL'}")
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    main()
