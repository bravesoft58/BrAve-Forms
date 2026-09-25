"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { collectFieldErrors } from "@/lib/forms/field-errors";
import { nnphDustPermitSchema, parseNnphDustPermitForm } from "@/lib/schemas/nnph-dust-permit";

export type NnphDustPermitState = {
  error: string;
  fieldErrors?: Record<string, string[]>;
};

export async function submitNnphDustPermit(
  _prevState: NnphDustPermitState,
  formData: FormData
): Promise<NnphDustPermitState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "You must be logged in." };
  }

  const projectId = formData.get("project_id") as string;
  if (!projectId) {
    return { error: "Missing project ID." };
  }

  const raw = parseNnphDustPermitForm(formData);
  const result = nnphDustPermitSchema.safeParse(raw);

  if (!result.success) {
    return { error: "Please fix the errors below.", fieldErrors: collectFieldErrors(result.error.issues) };
  }

  const data = result.data;
  const supabase = await createClient();

  const { error: insertError } = await supabase
    .from("form_submissions")
    .insert({
      project_id: projectId,
      form_type: "nnph_dust_permit",
      data,
      form_date: data.signature_date,
      status: "submitted",
      submitted_by: user.id,
      submitted_at: new Date().toISOString(),
    });

  if (insertError) {
    return { error: insertError.message };
  }

  revalidatePath(`/dashboard/projects/${projectId}`);
  redirect(`/dashboard/projects/${projectId}?tab=nnph_dust_permit`);
}
