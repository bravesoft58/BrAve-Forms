export default function SettingsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-[#233B5C] dark:text-zinc-100">
          Settings
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Application settings coming in a future sprint.
        </p>
      </div>

      <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 py-12 dark:border-zinc-700">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Company info, notification preferences, and system configuration.
        </p>
      </div>
    </div>
  );
}
