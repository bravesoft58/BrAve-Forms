# Evidence for ISSUE-001: Verify PostgreSQL 15 Installation

**Completed:** [Date TBD]
**Assignee:** [Name TBD]
**Time Taken:** [Actual hours]

## What Was Done

Verified PostgreSQL 15 is installed and running locally. Confirmed connection to braveforms database.

## Evidence Files

### deployment/

1. **psql-version.png**
   - Screenshot of `psql --version` command
   - Shows PostgreSQL 15.x installed

2. **service-running.png**
   - Screenshot of PostgreSQL service status
   - Confirms service is running

3. **database-connection.png**
   - Screenshot of successful `psql` connection
   - Shows postgres=# prompt

4. **braveforms-database.png**
   - Screenshot of `\l` output showing braveforms database
   - Confirms database exists

5. **env-connection-test.png**
   - Screenshot of connection using DATABASE_URL from .env
   - Proves backend can connect

## Issues Encountered

[Document any issues and how they were resolved]

Example:

- **Issue:** Password authentication failed
- **Solution:** Updated .env with correct postgres password

## Acceptance Criteria Verification

- [x] PostgreSQL 15.x is installed → Evidence: psql-version.png
- [x] PostgreSQL service is running → Evidence: service-running.png
- [x] Can connect to postgres database → Evidence: database-connection.png
- [x] braveforms database exists → Evidence: braveforms-database.png
- [x] Can connect using DATABASE_URL from .env → Evidence: env-connection-test.png

## Notes

[Any additional notes about the completion]

---

**Status:** Not Started (Waiting for completion)
