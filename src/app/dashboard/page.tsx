import { getCurrentUser } from "@/lib/auth";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[#233B5C]">
        Welcome back, {user?.fullName || "there"}
      </h1>
      <p className="mt-2 text-[#5C6F8A]">
        Here&apos;s your BrAve Forms dashboard.
      </p>
    </div>
  );
}
