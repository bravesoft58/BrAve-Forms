import Link from "next/link";
import { getAllSubmissions } from "@/lib/queries/projects";
import { FORM_LABELS, type FormType } from "@/lib/constants/permits";

const statusBadge: Record<string, string> = {
  draft: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  submitted: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  reviewed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  revised: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
};

const FORM_ROUTE_MAP: Partial<Record<FormType, string>> = {
  daily_dust_log: "dust-log",
  ndep_weekly_stormwater: "ndep-stormwater",
  ndot_weekly_stormwater: "ndot-stormwater",
  ndep_sad_application: "ndep-sad",
  nnph_dust_permit: "nnph-dust-permit",
};

export default async function FormsPage() {
  const submissions = await getAllSubmissions();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-[#233B5C] dark:text-zinc-100">
          Forms
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          All form submissions across projects.
        </p>
      </div>

      {submissions.length === 0 ? (
        <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 py-12 dark:border-zinc-700">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No form submissions yet.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-700 dark:border-zinc-700">
          {submissions.map((sub) => {
            const routeSlug = FORM_ROUTE_MAP[sub.form_type as FormType];
            const proj = sub.projects as unknown as { name: string } | { name: string }[] | null;
            const projectName = Array.isArray(proj)
              ? proj[0]?.name ?? "Unknown"
              : proj?.name ?? "Unknown";
            const viewHref = routeSlug
              ? `/dashboard/projects/${sub.project_id}/forms/${routeSlug}/${sub.id}`
              : null;

            const content = (
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {FORM_LABELS[sub.form_type as FormType] ?? sub.form_type}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                    {projectName} &middot;{" "}
                    {new Date(sub.form_date + "T00:00:00").toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                    {sub.submitted_at && (
                      <>
                        {" "}
                        &middot; submitted{" "}
                        {new Date(sub.submitted_at).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </>
                    )}
                  </p>
                </div>
                <span
                  className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                    statusBadge[sub.status] ?? statusBadge.draft
                  }`}
                >
                  {sub.status}
                </span>
              </div>
            );

            return viewHref ? (
              <li key={sub.id}>
                <Link
                  href={viewHref}
                  className="block px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  {content}
                </Link>
              </li>
            ) : (
              <li key={sub.id} className="px-4 py-3">
                {content}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
