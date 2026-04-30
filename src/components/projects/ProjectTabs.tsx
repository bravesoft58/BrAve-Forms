"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PERMIT_LABELS, FORM_LABELS, type FormType, type PermitType } from "@/lib/constants/permits";
import DocumentsTab from "./DocumentsTab";

interface Permit {
  id: string;
  permit_type: string;
  permit_number: string | null;
}

interface FormRequirement {
  id: string;
  form_type: string;
}

interface Submission {
  id: string;
  form_type: string;
  form_date: string;
  status: string;
  submitted_at: string | null;
  created_at: string;
}

interface ProjectDocument {
  id: string;
  name: string;
  category: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  created_at: string;
  download_url: string | null;
}

export default function ProjectTabs({
  projectId,
  activeTab,
  permits,
  formRequirements,
  submissions = [],
  documents = [],
  userRole = "user",
}: {
  projectId: string;
  activeTab: string;
  permits: Permit[];
  formRequirements: FormRequirement[];
  submissions?: Submission[];
  documents?: ProjectDocument[];
  userRole?: "admin" | "user";
}) {
  const pathname = usePathname();
  const basePath = pathname.split("?")[0];

  const staticTabs = [
    { key: "permits", label: "Permits" },
    { key: "documents", label: "Documents" },
    { key: "team", label: "Team" },
  ];

  const formTabs = formRequirements.map((fr) => ({
    key: fr.form_type,
    label: FORM_LABELS[fr.form_type as FormType] ?? fr.form_type,
  }));

  const allTabs = [staticTabs[0], ...formTabs, staticTabs[1], staticTabs[2]];

  return (
    <div>
      <div className="border-b border-zinc-200 dark:border-zinc-700">
        <nav className="-mb-px flex gap-4 overflow-x-auto" aria-label="Tabs">
          {allTabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <Link
                key={tab.key}
                href={`${basePath}?tab=${tab.key}`}
                className={`whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-[#5C6F8A] text-[#233B5C] dark:text-zinc-100"
                    : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-6">
        {activeTab === "permits" && (
          <PermitsContent permits={permits} />
        )}
        {activeTab === "documents" && (
          <DocumentsTab projectId={projectId} documents={documents} userRole={userRole} />
        )}
        {activeTab === "team" && (
          <Placeholder message="Team management coming soon." />
        )}
        {formTabs.some((ft) => ft.key === activeTab) && (
          <FormTabContent
            projectId={projectId}
            activeTab={activeTab}
            submissions={submissions.filter((s) => s.form_type === activeTab)}
          />
        )}
      </div>
    </div>
  );
}

function PermitsContent({ permits }: { permits: Permit[] }) {
  if (permits.length === 0) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-400">No permits assigned.</p>;
  }

  return (
    <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-700 dark:border-zinc-700">
      {permits.map((permit) => (
        <li key={permit.id} className="flex items-center justify-between px-4 py-3">
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {PERMIT_LABELS[permit.permit_type as PermitType] ?? permit.permit_type}
          </span>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            {permit.permit_number || "No permit number"}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Placeholder({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 py-12 dark:border-zinc-700">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{message}</p>
    </div>
  );
}

const FORM_ROUTE_MAP: Partial<Record<FormType, string>> = {
  daily_dust_log: "dust-log",
  ndep_weekly_stormwater: "ndep-stormwater",
  ndot_weekly_stormwater: "ndot-stormwater",
  ndep_sad_application: "ndep-sad",
  nnph_dust_permit: "nnph-dust-permit",
};

const statusBadge: Record<string, string> = {
  draft: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  submitted: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  reviewed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  revised: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
};

function FormTabContent({
  projectId,
  activeTab,
  submissions,
}: {
  projectId: string;
  activeTab: string;
  submissions: Submission[];
}) {
  const routeSlug = FORM_ROUTE_MAP[activeTab as FormType];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {submissions.length === 0
            ? `No ${FORM_LABELS[activeTab as FormType] ?? activeTab} submissions yet.`
            : `${submissions.length} submission${submissions.length === 1 ? "" : "s"}`}
        </p>
        {routeSlug && (
          <Link
            href={`/dashboard/projects/${projectId}/forms/${routeSlug}/new`}
            className="rounded-md bg-[#233B5C] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#1a2d47] focus:outline-none focus:ring-2 focus:ring-[#5C6F8A] focus:ring-offset-2"
          >
            New Entry
          </Link>
        )}
      </div>

      {submissions.length > 0 && (
        <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-700 dark:border-zinc-700">
          {submissions.map((sub) => {
            const viewHref = routeSlug
              ? `/dashboard/projects/${projectId}/forms/${routeSlug}/${sub.id}`
              : null;
            const content = (
              <>
                <div>
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {new Date(sub.form_date + "T00:00:00").toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  {sub.submitted_at && (
                    <span className="ml-2 text-xs text-zinc-500 dark:text-zinc-400">
                      at {new Date(sub.submitted_at).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                    statusBadge[sub.status] ?? statusBadge.draft
                  }`}
                >
                  {sub.status}
                </span>
              </>
            );

            return viewHref ? (
              <li key={sub.id}>
                <Link
                  href={viewHref}
                  className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  {content}
                </Link>
              </li>
            ) : (
              <li key={sub.id} className="flex items-center justify-between px-4 py-3">
                {content}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
