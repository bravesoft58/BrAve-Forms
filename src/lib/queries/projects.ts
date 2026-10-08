import { createClient } from "@/lib/supabase/server";
import {
  EQUIPMENT_PATH,
  HAS_EQUIPMENT_PATTERN,
  PREVIOUS_EQUIPMENT_LIMIT,
  mergePreviousEquipment,
  type PreviousEquipment,
} from "@/lib/forms/waterways-previous-equipment";

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
    // site_name: the Waterways site snapshot, for the "sites today" panel (null for other forms).
    .select("id, form_type, form_date, status, submitted_at, created_at, site_name:data->>site_name")
    .eq("project_id", projectId)
    .order("form_date", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

/**
 * The project's recent Working in Waterways inspections that list equipment,
 * merged newest first, with the JSON fields the "Copy from previous" picker
 * shows (BF-70). One capped read per site in `siteNames` plus one for the
 * whole project (BF-73), so a busy site cannot push a quieter site's history
 * out of the list; the project read also covers renamed or removed sites.
 * PostgREST has no per-group limit, hence a read per site (at most 20).
 * Read under the org-scoped submissions policy, so a crew member sees
 * colleagues' records on the same project.
 */
export async function getRecentWaterwaysEquipment(
  projectId: string,
  siteNames: readonly string[],
  limit = PREVIOUS_EQUIPMENT_LIMIT,
): Promise<PreviousEquipment[]> {
  const supabase = await createClient();

  const read = (siteName?: string) => {
    let query = supabase
      .from("form_submissions")
      .select(
        "id, form_date, created_at, site_name:data->>site_name, initials:data->>initials, equipment:data->>equipment_in_use",
      )
      .eq("project_id", projectId)
      .eq("form_type", "working_in_waterways")
      // Before the limit, so blank inspections never take a slot.
      .filter(EQUIPMENT_PATH, "match", HAS_EQUIPMENT_PATTERN);
    if (siteName !== undefined) query = query.eq("data->>site_name", siteName);
    return query
      .order("form_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);
  };

  const results = await Promise.all([read(), ...siteNames.map((siteName) => read(siteName))]);
  const failed = results.find((result) => result.error);
  if (failed?.error) throw new Error(failed.error.message);
  return mergePreviousEquipment(results.flatMap((result) => (result.data ?? []) as PreviousEquipment[]));
}

export async function getLatestSubmission(projectId: string, formType: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("form_submissions")
    .select("data")
    .eq("project_id", projectId)
    .eq("form_type", formType)
    .order("form_date", { ascending: false })
    .limit(1)
    .single();

  if (error) return null;
  return data;
}

export async function getAllSubmissions() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("form_submissions")
    .select(`
      id, form_type, form_date, status, submitted_at, created_at,
      project_id,
      projects ( name )
    `)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function getProjectDocuments(projectId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("project_documents")
    .select("id, name, category, file_path, file_size, mime_type, uploaded_by, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

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
