"""BF-60 rehearsal builder: splice the migration (and optionally the rollback) into the probe.

The probe ends in RAISE EXCEPTION (P0999), so running the combined block applies
the grants, exercises them, and rolls everything back. Prints the combined SQL
to stdout, or writes it to the path given.

  python Testing/security/bf60_rehearsal.py [--roundtrip] [out.sql]

--roundtrip also splices the paired rollback after the checks and compares the
full grant state with the state before the migration (probe check R1).
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MIGRATION = ROOT / "supabase/migrations/20260928192919_default_table_grants.sql"
ROLLBACK = ROOT / "supabase/migrations/_rollback/20260928192919_rollback.sql"
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
    sql = splice(PROBE.read_text(encoding="utf-8"), MIGRATION_MARKER, MIGRATION.read_text(encoding="utf-8"))
    if roundtrip:
        sql = splice(sql, ROLLBACK_MARKER, ROLLBACK.read_text(encoding="utf-8") + "\n  roundtrip := true;\n")
    return sql


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if a != "--roundtrip"]
    sql = build("--roundtrip" in sys.argv[1:])
    if args:
        Path(args[0]).write_text(sql, encoding="utf-8")
    else:
        sys.stdout.write(sql)
