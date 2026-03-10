import { createServiceClient } from "@/lib/supabase/service";

export async function validateToken(token: string): Promise<string | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("qr_tokens")
    .select("project_id")
    .eq("token", token)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (error || !data) return null;
  return data.project_id;
}

export interface PortalData {
  project: {
    id: string;
    name: string;
    address: string | null;
    status: string;
    start_date: string;
    completion_date: string | null;
    description: string | null;
    acres_disturbed: number | null;
    soil_type: string | null;
    superintendent_name: string | null;
    superintendent_phone: string | null;
    foreman_name: string | null;
    foreman_phone: string | null;
    pm_name: string | null;
    pm_phone: string | null;
  };
  permits: {
    id: string;
    permit_type: string;
    permit_number: string | null;
  }[];
  documents: {
    id: string;
    name: string;
    category: string;
    file_path: string;
    file_size: number;
    mime_type: string;
    created_at: string;
  }[];
  submissions: {
    id: string;
    form_type: string;
    form_date: string;
    status: string;
    submitted_at: string | null;
    data: Record<string, unknown> | unknown[];
  }[];
}

export async function getPortalData(projectId: string): Promise<PortalData | null> {
  const supabase = createServiceClient();

  const [projectRes, permitsRes, documentsRes, submissionsRes] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name, address, status, start_date, completion_date, description, acres_disturbed, soil_type, superintendent_name, superintendent_phone, foreman_name, foreman_phone, pm_name, pm_phone")
      .eq("id", projectId)
      .single(),
    supabase
      .from("project_permits")
      .select("id, permit_type, permit_number")
      .eq("project_id", projectId),
    supabase
      .from("project_documents")
      .select("id, name, category, file_path, file_size, mime_type, created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false }),
    supabase
      .from("form_submissions")
      .select("id, form_type, form_date, status, submitted_at, data")
      .eq("project_id", projectId)
      .order("form_date", { ascending: false }),
  ]);

  if (projectRes.error || !projectRes.data) return null;

  return {
    project: projectRes.data,
    permits: permitsRes.data ?? [],
    documents: documentsRes.data ?? [],
    submissions: submissionsRes.data ?? [],
  };
}
