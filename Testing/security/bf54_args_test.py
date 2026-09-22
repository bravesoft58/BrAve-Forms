"""Regression test for the argument-safety contract of bf54_delete_storage_objects.py.

Non-destructive BY CONSTRUCTION (verify round 3, Codex finding): the module is imported and
its two I/O boundaries -- load_env() (reads .env.local) and call() (reaches the Storage API) --
are replaced with fail-on-use stubs before main() runs. No argument case can therefore read
credentials or delete an object, even if the argparse guard regresses. The earlier version shelled
out to the real script with live .env.local and network access; had allow_abbrev been dropped, the
`--e` case would have deleted objects before the exit-code assertion ran (Codex reproduced this
against commit 7d58413).

Contract asserted:
  * Every abbreviation / typo / stray argument is rejected by argparse with exit code 2, BEFORE
    either I/O stub is touched (io_touched == False proves parsing stopped it, not the network).
  * `--help` exits 0, lists `--execute`, and touches no I/O.
  * The exact `--execute` flag and the default (no args) ARE accepted by argparse and then run into
    the fail-on-use stub -- proving the flag is honored while confirming that no accepted path can
    reach real Storage from this test (the stub intercepts the first real call).

Run: python Testing/security/bf54_args_test.py
"""
import importlib.util, io, os, sys
from contextlib import redirect_stderr, redirect_stdout

SCRIPT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "bf54_delete_storage_objects.py")

# Import the script as a module WITHOUT running main() (__name__ != "__main__").
_spec = importlib.util.spec_from_file_location("bf54_delete_storage_objects", SCRIPT)
_mod = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_mod)


class ForbiddenIO(Exception):
    """Raised by a stub if main() reaches a real I/O boundary during an argument test."""


def run_main(args):
    """Run _mod.main() with load_env/call stubbed to raise on use.

    Returns (exit_code, io_touched, stdout, stderr). exit_code is the SystemExit code
    (int), or the string "FORBIDDEN" if an I/O boundary was reached before any exit.
    """
    touched = {"hit": False}

    def load_env_stub(*a, **k):
        touched["hit"] = True
        raise ForbiddenIO("load_env() reached -- an argument test must never read .env.local")

    def call_stub(*a, **k):
        touched["hit"] = True
        raise ForbiddenIO("call() reached -- an argument test must never touch the Storage API")

    old_argv, old_load, old_call = sys.argv, _mod.load_env, _mod.call
    sys.argv = ["bf54_delete_storage_objects.py", *args]
    _mod.load_env, _mod.call = load_env_stub, call_stub
    out, err = io.StringIO(), io.StringIO()
    try:
        with redirect_stdout(out), redirect_stderr(err):
            _mod.main()
        code = 0  # main() always sys.exits; reaching here means it returned normally
    except SystemExit as e:
        c = e.code
        code = c if isinstance(c, int) else (0 if c in (None, "") else 1)
    except ForbiddenIO:
        code = "FORBIDDEN"
    finally:
        sys.argv, _mod.load_env, _mod.call = old_argv, old_load, old_call
    return code, touched["hit"], out.getvalue(), err.getvalue()


# Rejected forms: argparse must exit 2 before any I/O boundary is reached.
REJECTED = [["--e"], ["--ex"], ["--exec"], ["--execut"], ["--dryrun"],
            ["--dry-run"], ["--execute", "extra"], ["-x"]]


def main():
    failures = 0

    def report(ok, label, code, touched, extra=""):
        nonlocal failures
        failures += 0 if ok else 1
        print(f"{'PASS' if ok else 'FAIL'}  {label:24} exit={code!s:9} io_touched={touched}{extra}")

    for args in REJECTED:
        code, touched, _out, err = run_main(args)
        ok = code == 2 and not touched and "unrecognized arguments" in err
        report(ok, "reject " + " ".join(args), code, touched)

    # --help: exit 0, lists --execute, no I/O.
    code, touched, out, _err = run_main(["--help"])
    ok = code == 0 and not touched and "--execute" in out
    report(ok, "--help", code, touched, f"  lists_execute={'--execute' in out}")

    # Positive, still non-destructive: the exact flag and the default are ACCEPTED by argparse,
    # then intercepted by the fail-on-use stub (io_touched proves acceptance; the stub proves no
    # real Storage call escaped this test).
    for args, label in ((["--execute"], "accept --execute"), ([], "accept (no args)")):
        code, touched, _out, _err = run_main(args)
        ok = code == "FORBIDDEN" and touched
        report(ok, label, code, touched, "  (stub caught first real I/O)")

    print(f"RESULT: {'PASS' if failures == 0 else str(failures) + ' FAIL'}")
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    main()
