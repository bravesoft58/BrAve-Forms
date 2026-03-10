import { createClient } from "@/lib/supabase/server";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: "admin" | "user";
  created_at: string;
}

export async function getUsers(): Promise<UserProfile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, phone, role, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getUsers error:", error);
    return [];
  }

  return data as UserProfile[];
}
