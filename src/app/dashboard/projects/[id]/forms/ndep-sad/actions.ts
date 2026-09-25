"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { collectFieldErrors } from "@/lib/forms/field-errors";
import { ndepSadSchema, parseNdepSadForm } from "@/lib/schemas/ndep-sad";

export type NdepSadState = {
  error: string;
  fieldErrors?: Record<string, string[]>;
};

export async function submitNdepSad(
  _prevState: NdepSadState,
  formData: FormData
): Promise<NdepSadState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "You must be logged in." };
  }

  const projectId = formData.get("project_id") as string;
  if (!projectId) {
    return { error: "Missing project ID." };
  }

  const raw = parseNdepSadForm(formData);
  const result = ndepSadSchema.safeParse(raw);

  if (!result.success) {
    return { error: "Please fix the errors below.", fieldErrors: collectFieldErrors(result.error.issues) };
  }

  const data = result.data;
  const supabase = await createClient();

  const { error: insertError } = await supabase
    .from("form_submissions")
    .insert({
      project_id: projectId,
      form_type: "ndep_sad_application",
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
  redirect(`/dashboard/projects/${projectId}?tab=ndep_sad_application`);
}
