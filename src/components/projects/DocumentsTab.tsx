"use client";

import { useRef, useState, useTransition } from "react";
import { Upload, Trash2, Download, Loader2, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  saveDocumentRecord,
  deleteDocument,
  type DocumentActionState,
} from "@/app/dashboard/projects/[id]/document-actions";

const BUCKET = "project-documents";
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
const ALLOWED_TYPES: Record<string, string> = {
  "application/pdf": "PDF",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "XLSX",
  "image/jpeg": "JPG",
  "image/png": "PNG",
};
const ACCEPT = Object.keys(ALLOWED_TYPES).join(",");

const CATEGORIES = [
  { value: "permit", label: "Permit" },
  { value: "contract", label: "Contract" },
  { value: "map", label: "Map" },
  { value: "plan", label: "Plan" },
  { value: "other", label: "Other" },
] as const;

interface ProjectDocument {
  id: string;
  name: string;
  category: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  created_at: string;
}

interface DocumentsTabProps {
  projectId: string;
  documents: ProjectDocument[];
  userRole: "admin" | "user";
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentsTab({ projectId, documents, userRole }: DocumentsTabProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState("other");
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleUpload(files: FileList | null) {
    if (!files?.length) return;
    setError("");

    const file = files[0];

    if (file.size > MAX_FILE_SIZE) {
      setError(`File too large (${formatFileSize(file.size)}). Maximum is 25 MB.`);
      return;
    }

    if (!ALLOWED_TYPES[file.type]) {
      setError(`File type not allowed. Accepted: PDF, DOCX, XLSX, JPG, PNG.`);
      return;
    }

    setUploading(true);

    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() || "bin";
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const storagePath = `projects/${projectId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        setError(`Upload failed: ${uploadError.message}`);
        return;
      }

      // Save metadata via server action
      const formData = new FormData();
      formData.set("project_id", projectId);
      formData.set("name", file.name);
      formData.set("category", category);
      formData.set("file_path", storagePath);
      formData.set("file_size", file.size.toString());
      formData.set("mime_type", file.type);

      const initialState: DocumentActionState = { error: "" };
      const result = await saveDocumentRecord(initialState, formData);

      if (result.error) {
        setError(result.error);
        // Clean up uploaded file on metadata failure
        await supabase.storage.from(BUCKET).remove([storagePath]);
        return;
      }

      setCategory("other");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function handleDelete(doc: ProjectDocument) {
    setDeleting(doc.id);
    setError("");

    startTransition(async () => {
      const result = await deleteDocument(projectId, doc.id, doc.file_path);
      if (result.error) setError(result.error);
      setDeleting(null);
    });
  }

  function getDownloadUrl(filePath: string): string {
    const supabase = createClient();
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
    return data.publicUrl;
  }

  return (
    <div className="space-y-4">
      {/* Upload controls */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <div>
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
            disabled={uploading}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 rounded-md bg-[#233B5C] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#1a2d47] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {uploading ? "Uploading..." : "Upload Document"}
          </button>
        </div>

        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          PDF, DOCX, XLSX, JPG, PNG — max 25 MB
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {/* Document list */}
      {documents.length === 0 ? (
        <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 py-12 dark:border-zinc-700">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">No documents uploaded yet.</p>
        </div>
      ) : (
        <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-700 dark:border-zinc-700">
          {documents.map((doc) => (
            <li key={doc.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="h-5 w-5 shrink-0 text-zinc-400" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {doc.name}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    <span className="capitalize">{doc.category}</span>
                    {" · "}
                    {formatFileSize(doc.file_size)}
                    {" · "}
                    {new Date(doc.created_at).toLocaleDateString("en-US", {
                      month: "short", day: "numeric", year: "numeric",
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 ml-4">
                <a
                  href={getDownloadUrl(doc.file_path)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                  title="Download"
                >
                  <Download className="h-4 w-4" />
                </a>
                {userRole === "admin" && (
                  <button
                    type="button"
                    onClick={() => handleDelete(doc)}
                    disabled={deleting === doc.id || isPending}
                    className="rounded-md p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-950 dark:hover:text-red-400"
                    title="Delete"
                  >
                    {deleting === doc.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
