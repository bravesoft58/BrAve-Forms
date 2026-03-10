import { FileText, Download } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "project-documents";

interface Document {
  id: string;
  name: string;
  category: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  created_at: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getPublicUrl(filePath: string): string {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}

export default function InspectorDocumentsTab({ documents }: { documents: Document[] }) {
  if (documents.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 py-12 dark:border-zinc-700">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">No documents uploaded.</p>
      </div>
    );
  }

  return (
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
          <a
            href={getPublicUrl(doc.file_path)}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-4 shrink-0 rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            title="Download"
          >
            <Download className="h-4 w-4" />
          </a>
        </li>
      ))}
    </ul>
  );
}
