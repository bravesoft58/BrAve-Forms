/**
 * BF-72: when a Working in Waterways inspection reports a visible sheen or
 * plume, email the project's waterway contact. This module is the pure part:
 * when to send, what to say, and how the inspection page describes the result.
 * No database or network; the orchestration is in run-sheen-alert.ts.
 */

export const SHEEN_ALERT_KIND = "sheen_plume";

export type AlertStatus = "sending" | "sent" | "failed" | "no_contact" | "not_configured";

export interface AlertRow {
  status: AlertStatus;
  recipient: string | null;
  updated_at: string;
}

export interface WaterwayContact {
  name: string | null;
  phone: string | null;
}

type SheenAnswer = { sheen_or_plume?: { value?: string; comment?: string } } | null | undefined;

const isYes = (data: SheenAnswer) => data?.sheen_or_plume?.value === "Yes";

/**
 * True when this save turns the answer to Yes: a new inspection answering Yes,
 * or an edit from anything else to Yes. An edit that keeps Yes sends nothing.
 */
export function shouldSendSheenAlert(previous: SheenAnswer, next: SheenAnswer): boolean {
  return isYes(next) && !isYes(previous);
}

export interface SheenAlertFacts {
  projectName: string;
  siteName: string;
  inspectionDate: string; // YYYY-MM-DD
  inspectionTime: string; // HH:MM, Nevada
  initials: string;
  comment: string;
  contactName: string | null;
  link: string;
}

export function buildSheenAlertEmail(f: SheenAlertFacts): { subject: string; text: string } {
  const subject = `Sheen/plume reported: ${f.projectName} / ${f.siteName} / ${f.inspectionDate}`;
  const text = [
    `${f.contactName ? `${f.contactName}, a` : "A"} visible sheen or plume was reported on a Working in Waterways inspection.`,
    "",
    `Project: ${f.projectName}`,
    `Site: ${f.siteName}`,
    `Date and time: ${f.inspectionDate} ${f.inspectionTime}`,
    `Inspector initials: ${f.initials}`,
    `Comment: ${f.comment.trim() || "(none)"}`,
    "",
    `Open the inspection: ${f.link}`,
    "",
    "You are listed as this project's waterway contact. Please follow up now.",
    "Sent by BrAve Forms.",
  ].join("\n");
  return { subject, text };
}

/** Where the email's link points: the inspection's page in the app. */
export function inspectionLink(siteUrl: string | undefined, projectId: string, submissionId: string): string {
  const base = (siteUrl || "https://brave-forms.vercel.app").replace(/\/+$/, "");
  return `${base}/dashboard/projects/${projectId}/forms/working-in-waterways/${submissionId}`;
}

/** A row still "sending" after this long was cut off (the function was stopped). */
export const SENDING_STALE_MS = 5 * 60 * 1000;

/** `pending`: the result is not known yet, so the page refreshes until it is. */
export type AlertLine = { tone: "ok" | "warn"; text: string; pending?: true };

function callLine(contact: WaterwayContact): string {
  const name = contact.name?.trim();
  const phone = contact.phone?.trim();
  if (name && phone) return `Call ${name} at ${phone}.`;
  if (name) return `Call ${name}.`;
  return "Call the waterway contact.";
}

/**
 * The one line the inspection page shows under the sheen/plume answer, or null
 * when there is nothing to say (answer not Yes and no alert on record).
 *
 * `savedAt` is when the inspection was last saved. The save that turns the
 * answer to Yes sends the email after its response, and Next renders the page
 * that save redirects to before then, so no alert row exists yet. Within the
 * pending window that is "being sent", not "no alert recorded".
 */
export function describeSheenAlert(
  alert: AlertRow | null,
  sheenIsYes: boolean,
  contact: WaterwayContact,
  formatTime: (iso: string) => string,
  now: number = Date.now(),
  savedAt: string | null = null,
): AlertLine | null {
  // NaN (an unreadable timestamp) is never recent, so it falls to the warning.
  const recent = (iso: string) => now - Date.parse(iso) <= SENDING_STALE_MS;
  const pending: AlertLine = { tone: "ok", text: "The alert email is being sent.", pending: true };
  if (!alert) {
    if (!sheenIsYes) return null;
    if (savedAt && recent(savedAt)) return pending;
    return { tone: "warn", text: `No alert email was recorded for this inspection. ${callLine(contact)}` };
  }
  switch (alert.status) {
    case "sent":
      return { tone: "ok", text: `Alert emailed to ${alert.recipient ?? "the waterway contact"} at ${formatTime(alert.updated_at)}.` };
    case "sending":
      return recent(alert.updated_at)
        ? pending
        : { tone: "warn", text: `The alert email could not be confirmed. ${callLine(contact)}` };
    case "failed":
      return { tone: "warn", text: `The alert email to ${alert.recipient ?? "the waterway contact"} failed. ${callLine(contact)}` };
    case "not_configured":
      return { tone: "warn", text: `Email alerts are not set up for this organization. ${callLine(contact)}` };
    case "no_contact":
      return { tone: "warn", text: "No waterway contact email is set for this project, so no alert was sent." };
  }
}
