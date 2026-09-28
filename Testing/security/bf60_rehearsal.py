"""BF-60 rehearsal builder: splice the migrations (and optionally their rollbacks) into the probe.

The probe ends in RAISE EXCEPTION (P0999), so running the combined block applies
the grants, exercises them, and rolls everything back. Prints the combined SQL
to stdout, or writes it to the path given.

  python Testing/security/bf60_rehearsal.py [--roundtrip] [out.sql]

BF-60 ships as two migrations: the grants themselves and the verify round 1
correction for the built-in PUBLIC EXECUTE on new functions. Both are spliced
in order. --roundtrip also splices the paired rollbacks in reverse order after
the checks and compares the full grant state with the state before (probe R1).
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MIGRATIONS = ROOT / "supabase/migrations"
VERSIONS = ["20260928194436_default_table_grants", "20260928202957_default_function_execute_global"]
PROBE = ROOT / "Testing/security/bf60_grants_probe.sql"
MIGRATION_MARKER = "      -- @@MIGRATION@@"
ROLLBACK_MARKER = "  -- @@ROLLBACK@@"


def splice(text: str, marker: str, body: str) -> str:
    if text.count(marker) != 1:
        raise SystemExit(f"expected exactly one {marker.strip()} marker in {PROBE}")
    if "$probe$" in body:
        raise SystemExit("spliced SQL uses the $probe$ quote tag; it cannot be nested")
    return text.replace(marker, body)


def build(roundtrip: bool) -> str:
    forward = "\n".join((MIGRATIONS / f"{v}.sql").read_text(encoding="utf-8") for v in VERSIONS)
    sql = splice(PROBE.read_text(encoding="utf-8"), MIGRATION_MARKER, forward)
    if roundtrip:
        back = "\n".join(
            (MIGRATIONS / "_rollback" / f"{v.split('_', 1)[0]}_rollback.sql").read_text(encoding="utf-8")
            for v in reversed(VERSIONS)
        )
        sql = splice(sql, ROLLBACK_MARKER, back + "\n  roundtrip := true;\n")
    return sql


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if a != "--roundtrip"]
    sql = build("--roundtrip" in sys.argv[1:])
    if args:
        Path(args[0]).write_text(sql, encoding="utf-8")
    else:
        sys.stdout.write(sql)
