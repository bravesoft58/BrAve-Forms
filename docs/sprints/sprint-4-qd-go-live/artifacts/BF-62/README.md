# BF-62 evidence

Captured 2026-09-24 on branch preview `brave-forms-r6cujyjm5-embracingai.vercel.app` (deployment `dpl_FqVYg31vyowaPrsZUyFDY2PFRQ6f`, commit `c980b95`, Next.js 16.3.6, Node 24, pnpm 10.34.5). Tim signed in himself; the walkthrough was driven through Claude in Chrome.

| File | Shows |
| --- | --- |
| `01-ndot-form-view-signed-in-on-next-16-3-6.jpg` | NDOT Weekly Stormwater submission (Aug 6, 2026, project 17254 NDOT 4541 7 Bridges) rendering while signed in. |
| `02-inspector-portal-real-qr-on-next-16-3-6.jpg` | Inspector portal opened with a live QR token for the same project, listing its submitted forms read-only. |

Not captured as images:
- The PDF for that submission was fetched in the page and was not downloaded. The result was HTTP 200, `application/pdf`, 1,514,793 bytes, with a `%PDF-1.3` header and `%%EOF` trailer.
- Signed out, `/dashboard` redirected to `/login` on both previews.
- Runtime logs for the deployment carried no module-load errors. The only error line was the deliberate invalid-token probe.
