# BF-65 (+ BF-61) evidence

**Created:** 2026-09-28

Preview runs on 2026-09-28, signed in as Tim, against production data (TEST records, listed in the story).
A "lost reply" is simulated by patching `window.fetch` in the page so the server action request reaches the server and completes, and its response is then thrown away (`TypeError`).

| File | What it shows |
| --- | --- |
| `01-RED-lost-reply-replaces-form-with-error-page.jpg` | Before the fix (preview `fx18mppdm`, commit 9d6e599). The dust log was saved with its key (row `d47d6722`), but the thrown reply replaced the page with Next's "This page couldn't load" (Reload / Back). The form and its key are gone, so Reload would submit a duplicate. |
| `02-BF61-stale-save-refused-with-conflict-message.jpg` | BF-61. Two tabs opened the same TEST Waterways record (`2ca1db8d`). Tab B saved first. Tab A, still holding the old version, saved different text and got "This submission changed since you opened it. Reload to see the latest version." The database kept tab B's text. |
| `03-GREEN-lost-reply-keeps-form-with-message.jpg` | After the fix (branch preview, commit 34ec33f). The same lost reply leaves the form on screen with "The connection dropped before the server replied...". Pressing Submit again went to the project list, and the database holds exactly one row for that entry (`2fe6f8f1`). |
| `04-GREEN-retried-append-adds-entry-once.jpg` | "Add Entries" on `2fe6f8f1` with the same lost reply. The first attempt showed the message and the retry landed on the log. It has 2 entries (the original plus one appended), not 3. |
