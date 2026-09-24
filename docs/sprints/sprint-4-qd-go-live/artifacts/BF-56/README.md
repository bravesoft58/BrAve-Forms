# BF-56 evidence

Captured 2026-09-24 on branch preview `brave-forms-mgwuie3kj-embracingai.vercel.app` (deployment `dpl_2yRBMPbohLB4fwNTWy2Kxxqr4qmS`, commit `acb484c`). The BF-56 migration was applied to production at that point. Tim signed in himself; the walkthrough was driven through Claude in Chrome.

| File | Shows |
| --- | --- |
| `01-admin-qr-modal-stable-code-issued-date-revoke.jpg` | The Inspector QR modal on 17446 Deodar St: the stable code, the new wording (does not expire, 12-hour access per scan), the issue date, and the Revoke and reissue control. |
| `02-scan-redirects-to-inspector-portal-deodar-st.jpg` | Opening the stable QR URL lands on `/inspector`, not the QR URL, and renders the Deodar St portal. |

Not captured as images:
- The modal was opened, the page reloaded, and the modal opened again. Both opens returned token `e7de7102-3777-4a47-8fc7-412d778d7c31`.
- The database held one stable row for the project (`expires_at` NULL, not revoked), so the second open created nothing.
- The revoke button was not clicked on a live project (Tim, 2026-09-24): it would also revoke Deodar St's 30-day code from 2026-09-23. Revoke behaviour is covered by `Testing/security/bf56_session_e2e.mjs`.
- The stable token created here, `e7de7102…`, is a real production code for 17446 Deodar St. Its URL uses the preview host because the modal builds the link from the host it was opened on. Print codes from production.
