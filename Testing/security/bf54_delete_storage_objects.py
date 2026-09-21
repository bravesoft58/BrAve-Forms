"""BF-54: delete the Storage objects that belonged to the seven removed test projects.

The database cascade removes every child row of a deleted project, but Storage objects are not
cascaded (verified 2026-09-20). This script deletes the objects under `projects/<id>/` for each
removed project in both private buckets through the Storage API with the service-role key, then
prints what the API reported. Run AFTER the project rows are deleted. Idempotent: re-running
deletes nothing and reports zero. Never prints the key.

Usage: python Testing/security/bf54_delete_storage_objects.py [--dry-run]
"""
import json, os, sys, urllib.request, urllib.error

REMOVED_PROJECT_IDS = [
    "4dff54b4-c8f2-4d1f-8e59-b4bf764cba9c",  # BF 32 Test
    "06c0610c-6d41-4008-8d24-08f8c3d6cd49",  # E2E Test Project - Full Verification
    "f0244e03-fb12-48ba-b307-fc8495c545e1",  # I-15 Bridge Repair Phase 1
    "6a92e761-bcc4-42fa-8043-4d5938a77c04",  # Q&D Parking Lot
    "1ef41705-68ae-46c1-8eee-ff7cbdceec5c",  # South Meadows Mall
    "1a5c83b5-3798-45ca-b88b-2accda53151f",  # US-95 Test Project
    "00000000-0000-0000-0000-000000000001",  # US-95 Widening Phase 2
]
BUCKETS = ["form-attachments", "project-documents"]

def load_env():
    env = {}
    p = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env.local")
    for line in open(p, encoding="utf-8"):
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1); env[k.strip()] = v.strip().strip('"').strip("'")
    return env

def call(method, url, key, body=None):
    headers = {"apikey": key, "Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    req = urllib.request.Request(url, method=method, headers=headers, data=json.dumps(body).encode() if body is not None else None)
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            raw = r.read().decode("utf-8", "replace")
            return r.status, (json.loads(raw) if raw else None)
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "replace")

def list_objects(url, key, bucket, prefix):
    """Storage list is one folder level deep; walk it."""
    out, stack = [], [prefix]
    while stack:
        p = stack.pop()
        st, items = call("POST", f"{url}/storage/v1/object/list/{bucket}", key, {"prefix": p, "limit": 1000, "offset": 0})
        if st != 200 or not isinstance(items, list):
            print(f"  list {bucket}/{p}: HTTP {st}"); continue
        for it in items:
            name = f"{p.rstrip('/')}/{it['name']}" if p else it["name"]
            if it.get("id") is None:      # folder placeholder
                stack.append(name)
            else:
                out.append(name)
    return out

def main():
    dry = "--dry-run" in sys.argv
    env = load_env()
    url, key = env["NEXT_PUBLIC_SUPABASE_URL"].rstrip("/"), env["SUPABASE_SERVICE_ROLE_KEY"]
    total = 0
    for bucket in BUCKETS:
        targets = []
        for pid in REMOVED_PROJECT_IDS:
            targets += list_objects(url, key, bucket, f"projects/{pid}")
        print(f"{bucket}: {len(targets)} object(s) under removed projects")
        for t in targets: print(f"  - {t}")
        if targets and not dry:
            st, resp = call("DELETE", f"{url}/storage/v1/object/{bucket}", key, {"prefixes": targets})
            n = len(resp) if isinstance(resp, list) else 0
            print(f"  delete: HTTP {st}, {n} removed")
            total += n
    print(f"{'DRY RUN, nothing deleted' if dry else f'DONE: {total} object(s) deleted'}")

if __name__ == "__main__":
    main()
