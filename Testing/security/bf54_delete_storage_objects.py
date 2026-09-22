"""BF-54: delete the Storage objects that belonged to the seven removed test projects.

The database cascade removes every child row of a deleted project, but Storage objects are not
cascaded (verified 2026-09-20). This script deletes the objects under `projects/<id>/` for each
removed project in both private buckets through the Storage API with the service-role key.
Run AFTER the project rows are deleted. Idempotent: re-running deletes nothing and reports zero.
Never prints the key.

Safety contract (verify round 1 findings):
  * Default mode is a dry run. Deletion requires the exact flag `--execute`. argparse runs with
    `allow_abbrev=False`, so unknown arguments AND truncations such as `--exec` or `--e` are
    rejected with exit 2 before anything runs (verify round 2 finding). The contract is pinned
    by `bf54_args_test.py`.
  * A failed list or a failed DELETE is an error: the script prints it, skips nothing silently,
    and exits 1. After deleting, it re-lists every prefix and exits 1 if anything remains.

Usage:
  python Testing/security/bf54_delete_storage_objects.py            # dry run (default)
  python Testing/security/bf54_delete_storage_objects.py --execute  # delete
"""
import argparse, json, os, sys, urllib.request, urllib.error

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


class StorageError(Exception):
    pass


def load_env():
    env = {}
    p = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env.local")
    with open(p, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                env[k.strip()] = v.strip().strip('"').strip("'")
    missing = [k for k in ("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY") if not env.get(k)]
    if missing:
        raise SystemExit(f"missing in .env.local: {', '.join(missing)}")
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
    except (urllib.error.URLError, OSError) as e:
        return None, f"{type(e).__name__}: {e}"


def list_objects(url, key, bucket, prefix):
    """Storage list is one folder level deep; walk it. Raises on any failed list call."""
    out, stack = [], [prefix]
    while stack:
        p = stack.pop()
        st, items = call("POST", f"{url}/storage/v1/object/list/{bucket}", key, {"prefix": p, "limit": 1000, "offset": 0})
        if st != 200 or not isinstance(items, list):
            raise StorageError(f"list {bucket}/{p} failed: HTTP {st} {str(items)[:200]}")
        for it in items:
            name = f"{p.rstrip('/')}/{it['name']}" if p else it["name"]
            if it.get("id") is None:  # folder placeholder
                stack.append(name)
            else:
                out.append(name)
    return out


def targets_for(url, key, bucket):
    found = []
    for pid in REMOVED_PROJECT_IDS:
        found += list_objects(url, key, bucket, f"projects/{pid}")
    return found


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0], allow_abbrev=False)
    ap.add_argument("--execute", action="store_true", help="actually delete; without it the script only lists")
    args = ap.parse_args()  # unknown arguments and abbreviations are rejected here, before anything runs
    env = load_env()
    url, key = env["NEXT_PUBLIC_SUPABASE_URL"].rstrip("/"), env["SUPABASE_SERVICE_ROLE_KEY"]

    failures, total = 0, 0
    for bucket in BUCKETS:
        try:
            targets = targets_for(url, key, bucket)
        except StorageError as e:
            print(f"{bucket}: ERROR {e}")
            failures += 1
            continue
        print(f"{bucket}: {len(targets)} object(s) under removed projects")
        for t in targets:
            print(f"  - {t}")
        if not targets or not args.execute:
            continue
        st, resp = call("DELETE", f"{url}/storage/v1/object/{bucket}", key, {"prefixes": targets})
        removed = len(resp) if st == 200 and isinstance(resp, list) else 0
        print(f"  delete: HTTP {st}, {removed} removed")
        if st != 200 or removed != len(targets):
            print(f"  ERROR: expected {len(targets)} removed, API reported {removed}: {str(resp)[:200]}")
            failures += 1
        total += removed
        try:
            remaining = targets_for(url, key, bucket)
        except StorageError as e:
            print(f"  ERROR re-list after delete: {e}")
            failures += 1
            continue
        if remaining:
            print(f"  ERROR: {len(remaining)} object(s) still present after delete: {remaining[:3]}")
            failures += 1

    if not args.execute:
        print("DRY RUN, nothing deleted (pass --execute to delete)")
    elif failures:
        print(f"FAILED: {failures} error(s); {total} object(s) deleted; review the output before re-running")
    else:
        print(f"DONE: {total} object(s) deleted, re-list clean")
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    main()
