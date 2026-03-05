"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { projectCreateSchema, parseProjectForm } from "@/lib/schemas/project";
import { PERMIT_FORM_MAP, type FormType } from "@/lib/constants/permits";

export type ProjectState = {
  error: string;
  fieldErrors?: Record<string, string[]>;
};

export async function createProject(
  _prevState: ProjectState,
  formData: FormData
): Promise<ProjectState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "You must be logged in." };
  }

  const raw = parseProjectForm(formData);
  const result = projectCreateSchema.safeParse(raw);

  if (!result.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      const key = issue.path.join(".");
      if (!fieldErrors[key]) fieldErrors[key] = [];
      fieldErrors[key].push(issue.message);
    }
    return { error: "Please fix the errors below.", fieldErrors };
  }

  const data = result.data;
  const supabase = await createClient();

  // Insert project
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      name: data.name,
      address: data.address,
      start_date: data.start_date,
      completion_date: data.completion_date,
      description: data.description || null,
      acres_disturbed: data.acres_disturbed ? Number(data.acres_disturbed) : null,
      soil_type: data.soil_type || null,
      parcel_numbers: data.parcel_numbers || null,
      superintendent_name: data.superintendent_name || null,
      superintendent_phone: data.superintendent_phone || null,
      superintendent_email: data.superintendent_email || null,
      foreman_name: data.foreman_name || null,
      foreman_phone: data.foreman_phone || null,
      foreman_email: data.foreman_email || null,
      pm_name: data.pm_name || null,
      pm_phone: data.pm_phone || null,
      pm_email: data.pm_email || null,
      owner_rep_name: data.owner_rep_name || null,
      owner_rep_phone: data.owner_rep_phone || null,
      owner_rep_email: data.owner_rep_email || null,
      owner_rep_address: data.owner_rep_address || null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (projectError) {
    return { error: projectError.message };
  }

  const projectId = project.id;

  // Insert permits
  if (data.permits.length > 0) {
    const permitRows = data.permits.map((p) => ({
      project_id: projectId,
      permit_type: p.permit_type,
      permit_number: p.permit_number || null,
    }));

    const { error: permitError } = await supabase
      .from("project_permits")
      .insert(permitRows);

    if (permitError) {
      return { error: `Project created but permits failed: ${permitError.message}` };
    }
  }

  // Derive and insert form requirements (deduplicated)
  const formTypes = new Set<FormType>();
  for (const permit of data.permits) {
    for (const form of PERMIT_FORM_MAP[permit.permit_type]) {
      formTypes.add(form);
    }
  }

  if (formTypes.size > 0) {
    const formRows = Array.from(formTypes).map((ft) => ({
      project_id: projectId,
      form_type: ft,
      added_by: "auto_permit",
    }));

    const { error: formError } = await supabase
      .from("project_form_requirements")
      .insert(formRows);

    if (formError) {
      return { error: `Project created but form requirements failed: ${formError.message}` };
    }
  }

  // Assign creator to project
  const { error: assignError } = await supabase.from("project_users").insert({
    project_id: projectId,
    user_id: user.id,
    assigned_by: user.id,
    role: "admin",
  });

  if (assignError) {
    return { error: `Project created but user assignment failed: ${assignError.message}` };
  }

  revalidatePath("/dashboard/projects");
  redirect(`/dashboard/projects/${projectId}`);
}
