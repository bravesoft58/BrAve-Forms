"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PERMIT_LABELS, FORM_LABELS, type FormType, type PermitType } from "@/lib/constants/permits";

interface Permit {
  id: string;
  permit_type: string;
  permit_number: string | null;
}

interface FormRequirement {
  id: string;
  form_type: string;
}

export default function ProjectTabs({
  projectId,
  activeTab,
  permits,
  formRequirements,
}: {
  projectId: string;
  activeTab: string;
  permits: Permit[];
  formRequirements: FormRequirement[];
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
          <Placeholder message="Document management coming soon." />
        )}
        {activeTab === "team" && (
          <Placeholder message="Team management coming soon." />
        )}
        {formTabs.some((ft) => ft.key === activeTab) && (
          <FormTabContent projectId={projectId} activeTab={activeTab} />
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
};

function FormTabContent({ projectId, activeTab }: { projectId: string; activeTab: string }) {
  const routeSlug = FORM_ROUTE_MAP[activeTab as FormType];

  if (!routeSlug) {
    return (
      <Placeholder
        message={`${FORM_LABELS[activeTab as FormType] ?? activeTab} submissions will appear here.`}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {FORM_LABELS[activeTab as FormType]} submissions will appear here.
        </p>
        <Link
          href={`/dashboard/projects/${projectId}/forms/${routeSlug}/new`}
          className="rounded-md bg-[#233B5C] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#1a2d47] focus:outline-none focus:ring-2 focus:ring-[#5C6F8A] focus:ring-offset-2"
        >
          New Entry
        </Link>
      </div>
    </div>
  );
}
