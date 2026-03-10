import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getUsers } from "@/lib/queries/users";
import UsersClient from "./users-client";

export default async function UsersPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/dashboard");

  const users = await getUsers();

  return <UsersClient users={users} currentUserId={user.id} />;
}
