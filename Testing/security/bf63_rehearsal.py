"""BF-63 rehearsal builder: splice the migration into the probe's DO block.

The probe ends in RAISE EXCEPTION (P0999), so running the combined block
creates the table, trigger and grants, exercises them, and rolls all of it
back. Prints the combined SQL to stdout (or writes it to the path given).

  python Testing/security/bf63_rehearsal.py [out.sql]
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MIGRATION = ROOT / "supabase/migrations/20260928132447_form_submission_revisions.sql"
PROBE = ROOT / "Testing/security/bf63_revisions_probe.sql"
MARKER = "  -- @@MIGRATION@@"


def build() -> str:
    probe = PROBE.read_text(encoding="utf-8")
    if probe.count(MARKER) != 1:
        raise SystemExit(f"expected exactly one {MARKER.strip()} marker in {PROBE}")
    migration = MIGRATION.read_text(encoding="utf-8")
    if "$probe$" in migration:
        raise SystemExit("migration uses the $probe$ quote tag; it cannot be nested")
    return probe.replace(MARKER, migration)


if __name__ == "__main__":
    sql = build()
    if len(sys.argv) > 1:
        Path(sys.argv[1]).write_text(sql, encoding="utf-8")
    else:
        sys.stdout.write(sql)
