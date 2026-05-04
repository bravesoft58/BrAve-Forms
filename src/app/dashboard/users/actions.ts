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

// BF-31 RLS treats organization_members.role IN ('owner','admin') as the source of
// truth for org-admin access. The legacy profiles.role is no longer load-bearing for
// RLS, so every promote/invite path must keep org_members in sync with profile role.
function memberRoleFor(profileRole: "admin" | "user"): "admin" | "member" {
  return profileRole === "admin" ? "admin" : "member";
}

async function getAdminOrgId(adminId: string): Promise<string | null> {
  const service = createServiceClient();
  const { data } = await service
    .from("organization_members")
    .select("org_id")
    .eq("user_id", adminId)
    .order("joined_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return data?.org_id ?? null;
}

async function syncOrgMemberRole(
  orgId: string,
  userId: string,
  profileRole: "admin" | "user",
  invitedBy?: string,
): Promise<{ error: string | null }> {
  const service = createServiceClient();
  const { error } = await service
    .from("organization_members")
    .upsert(
      {
        org_id: orgId,
        user_id: userId,
        role: memberRoleFor(profileRole),
        ...(invitedBy ? { invited_by: invitedBy } : {}),
      },
      { onConflict: "org_id,user_id" },
    );
  return { error: error?.message ?? null };
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

  // Wait for the on_auth_user_created trigger to insert the profile row before we
  // update role or upsert org_members (the trigger only creates profiles, not memberships).
  await new Promise((r) => setTimeout(r, 500));

  // Find the new user's id so we can sync org_members. Profile is keyed on email here.
  const { data: newProfile } = await service
    .from("profiles")
    .select("id")
    .eq("email", email)
    .single();

  if (role === "admin" && newProfile) {
    const { error: roleError } = await service
      .from("profiles")
      .update({ role: "admin" })
      .eq("id", newProfile.id);

    if (roleError) {
      console.error("Role update error:", roleError);
      // User created but role update failed — not fatal; org sync below is gated on
      // the role we already validated, not on the DB read-back.
    }
  }

  // Add the invitee to the inviting admin's org with the matching membership role.
  // Without this, BF-31 RLS denies them every project-scoped query.
  if (newProfile) {
    const orgId = await getAdminOrgId(admin.id);
    if (orgId) {
      const { error: syncError } = await syncOrgMemberRole(
        orgId,
        newProfile.id,
        role as "admin" | "user",
        admin.id,
      );
      if (syncError) {
        console.error("Org member sync error:", syncError);
      }
    } else {
      console.error("inviteUser: inviting admin has no org_members row; cannot sync invitee.");
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

  // Sync organization_members.role so BF-31 RLS sees the new tier. Use the calling
  // admin's org context — single-org assumption holds until BF-33 ships.
  const orgId = await getAdminOrgId(admin.id);
  if (orgId) {
    const { error: syncError } = await syncOrgMemberRole(orgId, userId, newRole);
    if (syncError) {
      console.error("updateRole org_members sync error:", syncError);
      return { error: `Profile updated but org membership sync failed: ${syncError}` };
    }
  } else {
    console.error("updateRole: calling admin has no org_members row; cannot sync target.");
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
