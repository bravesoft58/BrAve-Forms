"use client";

import { ArrowLeft, Download, Pencil } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type FormType =
  | "daily_dust_log"
  | "ndot_weekly_stormwater"
  | "ndep_weekly_stormwater"
  | "ndep_sad_application"
  | "nnph_dust_permit";

interface FormActionsProps {
  backHref: string;
  submissionId: string;
  /**
   * Optional: pass the form type + edit href to render an admin-only Edit button.
   * Forms that haven't been refactored for in-place edit (NDEP-stormwater, NDEP-SAD,
   * NNPH dust) render the button disabled with a "coming next sprint" tooltip.
   */
  formType?: FormType;
  editHref?: string;
  canEdit?: boolean;
}

const EDIT_SUPPORTED: ReadonlySet<FormType> = new Set([
  // daily_dust_log uses its own "Add Entries" button on the view page (append-only model)
  "ndot_weekly_stormwater",
]);

export default function FormActions({
  backHref,
  submissionId,
  formType,
  editHref,
  canEdit,
}: FormActionsProps) {
  const router = useRouter();

  const showEdit =
    canEdit && formType !== undefined && formType !== "daily_dust_log";
  const editEnabled = showEdit && EDIT_SUPPORTED.has(formType!) && Boolean(editHref);

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

      {showEdit &&
        (editEnabled ? (
          <Link
            href={editHref!}
            className="inline-flex items-center gap-2 rounded-md border border-[#5C6F8A] bg-white px-4 py-2 text-sm font-medium text-[#233B5C] shadow-sm hover:bg-[#5C6F8A]/10 dark:border-zinc-500 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </Link>
        ) : (
          <button
            type="button"
            disabled
            title="Edit for this form type is coming next sprint."
            className="inline-flex cursor-not-allowed items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800/40 dark:text-zinc-500"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </button>
        ))}

      <a
        href={`/api/forms/${submissionId}/pdf`}
        className="inline-flex items-center gap-2 rounded-md bg-[#233B5C] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#1a2d47]"
      >
        <Download className="h-4 w-4" />
        Download PDF
      </a>
    </div>
  );
}
