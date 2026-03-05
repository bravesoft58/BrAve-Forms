import { getCurrentUser } from "@/lib/auth";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
        Welcome back, {user?.fullName || "there"}
      </h1>
      <p className="mt-2 text-zinc-500 dark:text-zinc-400">
        Here&apos;s your BrAve Forms dashboard.
      </p>
    </div>
  );
}
