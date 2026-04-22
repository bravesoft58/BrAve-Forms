"use server";

import { createClient } from "@/lib/supabase/server";

export type ForgotPasswordState = {
  error: string;
  success?: string;
};

export async function resetPassword(
  _prevState: ForgotPasswordState,
  formData: FormData
): Promise<ForgotPasswordState> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();

  if (!email) {
    return { error: "Email is required." };
  }

  const supabase = await createClient();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://brave-forms.vercel.app";
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/confirm?next=/reset-password`,
  });

  if (error) {
    console.error("resetPassword error:", error);
    return { error: `Failed to send reset email: ${error.message}` };
  }

  // Always show success to prevent email enumeration
  return { error: "", success: "If an account exists with that email, a password reset link has been sent." };
}
