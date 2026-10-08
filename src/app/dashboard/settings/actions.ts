"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { getAdminOrg } from "@/lib/queries/email-settings";
import { emailSettingsSchema, parseEmailSettingsForm } from "@/lib/schemas/email-settings";
import { collectFieldErrors } from "@/lib/forms/field-errors";
import { encryptSecret, SecretKeyMissingError } from "@/lib/email/secret-box";
import { sendOrgEmail } from "@/lib/email/send-mail";
import { describeSendFailure } from "@/lib/email/send-result";

export type EmailSettingsState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  message?: string;
};

const NOT_ADMIN = "Only an organization admin can change email settings.";

export async function saveEmailSettings(
  _prev: EmailSettingsState,
  formData: FormData,
): Promise<EmailSettingsState> {
  const admin = await getAdminOrg();
  if (!admin) return { error: NOT_ADMIN };

  const parsed = emailSettingsSchema.safeParse(parseEmailSettingsForm(formData));
  if (!parsed.success) return { fieldErrors: collectFieldErrors(parsed.error.issues) };
  const { client_secret, ...fields } = parsed.data;

  const service = createServiceClient();
  const { data: existing, error: readError } = await service
    .from("organization_email_settings")
    .select("org_id")
    .eq("org_id", admin.orgId)
    .maybeSingle();
  if (readError) return { error: `Could not read the current settings: ${readError.message}` };
  if (!existing && !client_secret) {
    return { fieldErrors: { client_secret: ["Paste the client secret value"] } };
  }

  let ciphertext: string | undefined;
  if (client_secret) {
    try {
      ciphertext = encryptSecret(client_secret, admin.orgId);
    } catch (e) {
      if (e instanceof SecretKeyMissingError) {
        console.error("[settings] EMAIL_SETTINGS_KEY is not configured", { error: e.message });
        return { error: "This deployment has no encryption key for email settings (EMAIL_SETTINGS_KEY). Nothing was saved." };
      }
      throw e;
    }
  }

  // A changed configuration invalidates the last test result.
  const row = {
    ...fields,
    ...(ciphertext ? { client_secret_ciphertext: ciphertext } : {}),
    last_test_at: null,
    last_test_ok: null,
    last_test_error: null,
    updated_by: admin.userId,
  };
  const { error } = existing
    ? await service.from("organization_email_settings").update(row).eq("org_id", admin.orgId)
    : await service.from("organization_email_settings").insert({ org_id: admin.orgId, ...row });
  if (error) return { error: `Could not save the settings: ${error.message}` };

  revalidatePath("/dashboard", "layout");
  return { message: "Saved. Send a test email to check it works." };
}

// Takes nothing from the form: the recipient is always the signed-in admin.
export async function sendTestEmail(): Promise<EmailSettingsState> {
  const admin = await getAdminOrg();
  if (!admin) return { error: NOT_ADMIN };

  const result = await sendOrgEmail(admin.orgId, {
    to: admin.email,
    subject: "BrAve Forms test email",
    text:
      "This is a test from BrAve Forms. If you can read it, email alerts are set up: " +
      "BrAve Forms can send from this mailbox.",
  });
  if (!result.ok && result.reason === "not_configured") {
    return { error: describeSendFailure(result.reason) };
  }

  const { error } = await createServiceClient()
    .from("organization_email_settings")
    .update({
      last_test_at: new Date().toISOString(),
      last_test_ok: result.ok,
      last_test_error: result.ok ? null : describeSendFailure(result.reason, result.detail),
    })
    .eq("org_id", admin.orgId);
  if (error) console.error("[settings] could not record the test result", { error: error.message });

  revalidatePath("/dashboard/settings");
  return result.ok
    ? { message: `Test email sent to ${admin.email}. Microsoft accepted it; check that inbox.` }
    : { error: describeSendFailure(result.reason, result.detail) };
}
