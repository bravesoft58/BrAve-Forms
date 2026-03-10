"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

export type DocumentActionState = {
  error: string;
};

const BUCKET = "project-documents";

export async function saveDocumentRecord(
  _prevState: DocumentActionState,
  formData: FormData
): Promise<DocumentActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "You must be logged in." };

  const projectId = formData.get("project_id") as string;
  const name = formData.get("name") as string;
  const category = formData.get("category") as string;
  const filePath = formData.get("file_path") as string;
  const fileSize = Number(formData.get("file_size") || 0);
  const mimeType = formData.get("mime_type") as string;

  if (!projectId || !name || !category || !filePath) {
    return { error: "Missing required fields." };
  }

  const supabase = await createClient();
  const { error: insertError } = await supabase
    .from("project_documents")
    .insert({
      project_id: projectId,
      name,
      category,
      file_path: filePath,
      file_size: fileSize,
      mime_type: mimeType,
      uploaded_by: user.id,
    });

  if (insertError) return { error: insertError.message };

  revalidatePath(`/dashboard/projects/${projectId}`);
  return { error: "" };
}

export async function deleteDocument(
  projectId: string,
  documentId: string,
  filePath: string
): Promise<DocumentActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "You must be logged in." };
  if (user.role !== "admin") return { error: "Only admins can delete documents." };

  const supabase = await createClient();

  // Delete metadata row first (reversible — file still in storage if this fails)
  const { error: dbError } = await supabase
    .from("project_documents")
    .delete()
    .eq("id", documentId);

  if (dbError) return { error: dbError.message };

  // Delete from storage (orphaned file is harmless if this fails)
  const { error: storageError } = await supabase.storage
    .from(BUCKET)
    .remove([filePath]);

  if (storageError) return { error: `File removed from records but storage cleanup failed: ${storageError.message}` };

  revalidatePath(`/dashboard/projects/${projectId}`);
  return { error: "" };
}
