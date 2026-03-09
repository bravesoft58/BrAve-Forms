import { createClient } from "@/lib/supabase/server";

export async function getProjects() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("projects")
    .select("id, name, address, status, start_date, created_at")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function getProjectById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("projects")
    .select(`
      *,
      project_permits (*),
      project_form_requirements (*)
    `)
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
}

export async function getProjectFormRequirements(projectId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("project_form_requirements")
    .select("*")
    .eq("project_id", projectId);

  if (error) throw new Error(error.message);
  return data;
}

export async function getProjectSubmissions(projectId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("form_submissions")
    .select("id, form_type, form_date, status, submitted_at, created_at")
    .eq("project_id", projectId)
    .order("form_date", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function getSubmissionById(submissionId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("form_submissions")
    .select("*")
    .eq("id", submissionId)
    .single();

  if (error) return null;
  return data;
}
