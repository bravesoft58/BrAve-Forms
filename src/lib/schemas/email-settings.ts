import { z } from "zod";

// BF-74: the organization's Microsoft 365 email settings, as posted by the
// settings form. The client secret is write-only: blank keeps the stored one,
// so it is optional here and the action requires it only on first save.

const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Entra accepts the tenant as its GUID or as one of its verified domain names.
const DOMAIN = /^(?=.{4,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;

const trimmed = z.string().transform((v) => v.trim());

export const emailSettingsSchema = z.object({
  tenant_id: trimmed.pipe(
    z.string().refine((v) => GUID.test(v) || DOMAIN.test(v), "Enter the Directory (tenant) ID"),
  ),
  client_id: trimmed.pipe(z.string().regex(GUID, "Enter the Application (client) ID")),
  sender_mailbox: trimmed.pipe(z.string().email("Enter the sender mailbox address").max(254)),
  client_secret: trimmed.pipe(z.string().max(1000, "That secret is too long")),
  client_secret_expires_on: trimmed.pipe(z.string().date("Enter the date the secret expires")),
});

export type EmailSettingsInput = z.infer<typeof emailSettingsSchema>;

export function parseEmailSettingsForm(formData: FormData): Record<string, string> {
  const raw: Record<string, string> = {};
  for (const key of Object.keys(emailSettingsSchema.shape)) {
    const v = formData.get(key);
    raw[key] = typeof v === "string" ? v : "";
  }
  return raw;
}

export const SECRET_EXPIRY_WARNING_DAYS = 30;

/**
 * Days until the client secret expires (negative once it has), or null when
 * the expiry is more than 30 days away. Both dates are YYYY-MM-DD.
 */
export function secretExpiryDaysLeft(expiresOn: string, today: string): number | null {
  const days = Math.round((Date.parse(expiresOn) - Date.parse(today)) / 86_400_000);
  if (Number.isNaN(days)) return null;
  return days <= SECRET_EXPIRY_WARNING_DAYS ? days : null;
}

export function secretExpiryMessage(daysLeft: number): string {
  const subject = "The Microsoft 365 client secret for email alerts";
  if (daysLeft < 0) return `${subject} has expired. Alerts cannot be sent.`;
  if (daysLeft === 0) return `${subject} expires today.`;
  return `${subject} expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}.`;
}
