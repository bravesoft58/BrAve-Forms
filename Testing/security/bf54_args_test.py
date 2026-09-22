"""Regression test for the argument-safety contract of bf54_delete_storage_objects.py.

No network: every case below must be decided by argparse before the script touches .env.local or
the Storage API. Asserts that only the exact flag `--execute` is accepted and that abbreviations,
typos and stray arguments exit 2 (argparse usage error).

Run: python Testing/security/bf54_args_test.py
"""
import os, subprocess, sys

SCRIPT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "bf54_delete_storage_objects.py")

# (arguments, expected exit code, must-contain in stderr)
CASES = [
    (["--e"], 2, "unrecognized arguments"),
    (["--ex"], 2, "unrecognized arguments"),
    (["--exec"], 2, "unrecognized arguments"),
    (["--execut"], 2, "unrecognized arguments"),
    (["--dryrun"], 2, "unrecognized arguments"),
    (["--dry-run"], 2, "unrecognized arguments"),   # the old flag is gone; dry run is the default
    (["--execute", "extra"], 2, "unrecognized arguments"),
    (["-x"], 2, "unrecognized arguments"),
]


def main():
    failures = 0
    for args, want, needle in CASES:
        p = subprocess.run([sys.executable, SCRIPT, *args], capture_output=True, text=True, timeout=60)
        ok = p.returncode == want and needle in p.stderr
        failures += 0 if ok else 1
        print(f"{'PASS' if ok else 'FAIL'}  {' '.join(args):22} exit={p.returncode} (want {want})  stderr~'{needle}'={needle in p.stderr}")
    # --help must exit 0 without running anything
    p = subprocess.run([sys.executable, SCRIPT, "--help"], capture_output=True, text=True, timeout=60)
    ok = p.returncode == 0 and "--execute" in p.stdout and "DONE" not in p.stdout
    failures += 0 if ok else 1
    print(f"{'PASS' if ok else 'FAIL'}  --help                 exit={p.returncode} (want 0), lists --execute, runs nothing")
    print(f"RESULT: {'PASS' if failures == 0 else str(failures) + ' FAIL'}")
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    main()
