import ProjectForm from "@/components/projects/project-form";

export default function NewProjectPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight text-[#233B5C] dark:text-zinc-100">
        Create New Project
      </h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Fill out project details and select applicable permits.
      </p>
      <div className="mt-6">
        <ProjectForm />
      </div>
    </div>
  );
}
