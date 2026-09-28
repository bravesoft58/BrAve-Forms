# BF-58.2 evidence

**Created:** 2026-09-28

| File | What it shows |
| --- | --- |
| `01-sample-waterways-pdf-fixture.pdf` | The Working in Waterways PDF rendered from fixture data (site Western Drainage on Microsoft RNO18, all four checks, two comments, equipment, one photo) by `Testing/forms/bf58_2_waterways_pdf_test.ts` with `BF58_2_SAMPLE_PDF` set. The photo is a BF-58.1 screenshot standing in for a site photo. Not production data. Suitable to send Gracie as a first look at the layout; her sign-off (AC 5) still needs the PDF from a real submission with phone photos. |
| `02-sites-today-before-both-no-form.jpg` | Preview, RNO 18 Waterways tab before the test: "Sites today (Mon, Sep 28)", both sites "No form today", no submissions. |
| `03-sites-today-after-western-submitted.jpg` | After one TEST submission for Western Drainage: Western "Submitted today", Eastern still "No form today" (AC 3). |
| `04-view-page-photo-and-download-pdf-button.jpg` | The TEST submission's view page: answers, comments, the signed photo, and the Download PDF button that BF-58.1 hid (AC 1, AC 4). |
| `05-inspector-portal-waterways-detail-with-photo.jpg` | Inspector portal opened from the project's existing QR link (issued 2026-09-25, not reissued): the Waterways record with the new renderer and the signed photo, which loaded at 900x1200 (AC 2). |
| `06-preview-pdf-extracted-text.txt` | The PDF fetched from that Download PDF link on the preview: 1 page, 1 embedded 900x1200 JPEG, and every field, answer and comment in the decoded text (AC 1). |

The TEST photo was a portrait JPEG drawn on a canvas in the page and attached through the form's own file input, because the browser tool may only upload files shared with the session. It proves the pipeline, not phone EXIF rotation; that stays with Gracie's AC 5 check.
