import Link from "next/link";

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  completed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  on_hold: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  archived: "bg-zinc-100 text-zinc-600 dark:bg-zinc-700/30 dark:text-zinc-400",
};

export default function ProjectCard({
  project,
}: {
  project: {
    id: string;
    name: string;
    address: string | null;
    status: string;
    start_date: string | null;
  };
}) {
  const badgeClass = statusColors[project.status] ?? statusColors.archived;

  return (
    <Link
      href={`/dashboard/projects/${project.id}`}
      className="block rounded-lg border border-zinc-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-700 dark:bg-zinc-800"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-[#233B5C] dark:text-zinc-100">
          {project.name}
        </h3>
        <span
          className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${badgeClass}`}
        >
          {project.status.replace("_", " ")}
        </span>
      </div>
      {project.address && (
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {project.address}
        </p>
      )}
      {project.start_date && (
        <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
          Starts {new Date(project.start_date).toLocaleDateString()}
        </p>
      )}
    </Link>
  );
}
