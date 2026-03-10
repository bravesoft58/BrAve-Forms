"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { FORM_LABELS, type FormType } from "@/lib/constants/permits";

interface Submission {
  id: string;
  form_type: string;
  form_date: string;
  status: string;
  submitted_at: string | null;
  data: Record<string, unknown> | unknown[];
}

const statusBadge: Record<string, string> = {
  draft: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  submitted: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  reviewed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  revised: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getSummaryFields(formType: string, data: Record<string, unknown> | unknown[]): { label: string; value: string }[] {
  if (Array.isArray(data)) {
    // Dust log — array of entries
    return [{ label: "Entries", value: `${data.length} inspection${data.length === 1 ? "" : "s"} recorded` }];
  }

  switch (formType) {
    case "ndep_weekly_stormwater":
      return [
        { label: "Inspector", value: String(data.inspector_name || "—") },
        { label: "Weather", value: String(data.weather_conditions || "—") },
        { label: "Rainfall", value: data.rainfall_amount ? `${data.rainfall_amount}"` : "None" },
      ];
    case "ndot_weekly_stormwater":
      return [
        { label: "Inspector", value: String(data.inspector_name || "—") },
        { label: "Weather", value: String(data.weather_conditions || "—") },
        { label: "Rainfall", value: data.rainfall_amount ? `${data.rainfall_amount}"` : "None" },
      ];
    case "ndep_sad_application":
      return [
        { label: "Applicant", value: String(data.applicant_name || "—") },
        { label: "Total Acres", value: data.total_acres ? `${data.total_acres} ac` : "—" },
        { label: "Signature", value: data.signature_name ? "Signed" : "Unsigned" },
      ];
    case "nnph_dust_permit":
      return [
        { label: "Applicant", value: String(data.applicant_name || data.company_name || "—") },
        { label: "Application Type", value: String(data.application_type || "—") },
        { label: "Signature", value: data.signature_name ? "Signed" : "Unsigned" },
      ];
    default:
      return [];
  }
}

export default function InspectorFormsTab({ submissions }: { submissions: Submission[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  if (submissions.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 py-12 dark:border-zinc-700">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">No form submissions yet.</p>
      </div>
    );
  }

  // Group by form_type
  const grouped = submissions.reduce<Record<string, Submission[]>>((acc, sub) => {
    if (!acc[sub.form_type]) acc[sub.form_type] = [];
    acc[sub.form_type].push(sub);
    return acc;
  }, {});

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([formType, subs]) => (
        <div key={formType}>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            {FORM_LABELS[formType as FormType] ?? formType}
            <span className="ml-2 text-xs font-normal">({subs.length})</span>
          </h3>
          <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-700 dark:border-zinc-700">
            {subs.map((sub) => {
              const isExpanded = expanded.has(sub.id);
              const summary = getSummaryFields(sub.form_type, sub.data);

              return (
                <li key={sub.id}>
                  <button
                    type="button"
                    onClick={() => toggleExpand(sub.id)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 shrink-0 text-zinc-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0 text-zinc-400" />
                      )}
                      <div>
                        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {formatDate(sub.form_date)}
                        </span>
                        {sub.submitted_at && (
                          <span className="ml-2 text-xs text-zinc-500 dark:text-zinc-400">
                            submitted {new Date(sub.submitted_at).toLocaleDateString("en-US", {
                              month: "short", day: "numeric",
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                        statusBadge[sub.status] ?? statusBadge.draft
                      }`}
                    >
                      {sub.status}
                    </span>
                  </button>
                  {isExpanded && summary.length > 0 && (
                    <div className="border-t border-zinc-100 bg-zinc-50/50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-800/30">
                      <dl className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
                        {summary.map((field) => (
                          <div key={field.label}>
                            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                              {field.label}
                            </dt>
                            <dd className="mt-0.5 text-sm text-zinc-900 dark:text-zinc-100">
                              {field.value}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
