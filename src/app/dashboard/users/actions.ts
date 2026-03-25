"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

export type UserActionState = {
  error: string;
  success?: string;
};

async function requireAdmin(): Promise<{ id: string } | UserActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "You must be logged in." };
  if (user.role !== "admin") return { error: "Admin access required." };
  return { id: user.id };
}

export async function inviteUser(
  _prevState: UserActionState,
  formData: FormData
): Promise<UserActionState> {
  const admin = await requireAdmin();
  if ("error" in admin) return admin;

  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const fullName = (formData.get("full_name") as string)?.trim();
  const role = (formData.get("role") as string) || "user";

  if (!email || !fullName) {
    return { error: "Email and full name are required." };
  }

  if (!["admin", "user"].includes(role)) {
    return { error: "Invalid role." };
  }

  const service = createServiceClient();

  // Check if user already exists
  const { data: existing } = await service
    .from("profiles")
    .select("id")
    .eq("email", email)
    .single();

  if (existing) {
    return { error: "A user with this email already exists." };
  }

  // Create user via admin API — sends invite email automatically
  const { error: createError } = await service.auth.admin.inviteUserByEmail(
    email,
    {
      data: { full_name: fullName },
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "https://brave-forms.vercel.app"}/login`,
    }
  );

  if (createError) {
    console.error("inviteUser error:", createError);
    return { error: `Failed to invite user: ${createError.message}` };
  }

  // Update role if admin (trigger creates profile with default 'user')
  if (role === "admin") {
    // Small delay to let the trigger create the profile
    await new Promise((r) => setTimeout(r, 500));
    const { error: roleError } = await service
      .from("profiles")
      .update({ role: "admin" })
      .eq("email", email);

    if (roleError) {
      console.error("Role update error:", roleError);
      // User created but role update failed — not fatal
    }
  }

  revalidatePath("/dashboard/users");
  return { error: "", success: `Invite sent to ${email}` };
}

export async function deleteUser(userId: string): Promise<UserActionState> {
  const admin = await requireAdmin();
  if ("error" in admin) return admin;

  if (userId === admin.id) {
    return { error: "You cannot delete yourself." };
  }

  const service = createServiceClient();

  const { error } = await service.auth.admin.deleteUser(userId);
  if (error) {
    console.error("deleteUser error:", error);
    return { error: `Failed to delete user: ${error.message}` };
  }

  // Profile auto-deleted via FK cascade
  revalidatePath("/dashboard/users");
  return { error: "", success: "User deleted." };
}

export async function updateRole(
  userId: string,
  newRole: "admin" | "user"
): Promise<UserActionState> {
  const admin = await requireAdmin();
  if ("error" in admin) return admin;

  if (userId === admin.id) {
    return { error: "You cannot change your own role." };
  }

  // Use service client to bypass RLS — admins can't update other users' profiles via regular client
  const service = createServiceClient();
  const { error } = await service
    .from("profiles")
    .update({ role: newRole })
    .eq("id", userId);

  if (error) {
    console.error("updateRole error:", error);
    return { error: `Failed to update role: ${error.message}` };
  }

  revalidatePath("/dashboard/users");
  return { error: "", success: `Role updated to ${newRole}.` };
}

export async function resendInvite(
  email: string
): Promise<UserActionState> {
  const admin = await requireAdmin();
  if ("error" in admin) return admin;

  if (!email) {
    return { error: "Email is required." };
  }

  const service = createServiceClient();

  const { error } = await service.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "https://brave-forms.vercel.app"}/login`,
  });

  if (error) {
    console.error("resendInvite error:", error);
    return { error: `Failed to resend invite: ${error.message}` };
  }

  return { error: "", success: `Invite resent to ${email}` };
}
