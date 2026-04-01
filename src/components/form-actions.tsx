"use client";

import { ArrowLeft, Eye, Download } from "lucide-react";
import { useRouter } from "next/navigation";

interface FormActionsProps {
  backHref: string;
  submissionId: string;
}

export default function FormActions({ backHref, submissionId }: FormActionsProps) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-3 border-t border-zinc-200 pt-6 dark:border-zinc-800 print:hidden">
      <button
        type="button"
        onClick={() => router.push(backHref)}
        className="inline-flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
      >
        <Eye className="h-4 w-4" />
        View
      </button>

      <a
        href={`/api/forms/${submissionId}/pdf`}
        download
        className="inline-flex items-center gap-2 rounded-md bg-[#233B5C] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#1a2d47]"
      >
        <Download className="h-4 w-4" />
        Download PDF
      </a>
    </div>
  );
}
