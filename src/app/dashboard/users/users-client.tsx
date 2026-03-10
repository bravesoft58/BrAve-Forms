"use client";

import { useActionState, useState, useTransition } from "react";
import { UserPlus, Trash2, Shield, ShieldOff, Loader2 } from "lucide-react";
import { inviteUser, deleteUser, updateRole, type UserActionState } from "./actions";
import type { UserProfile } from "@/lib/queries/users";

const inputClass =
  "mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#5C6F8A] focus:outline-none focus:ring-1 focus:ring-[#5C6F8A] dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100";

const initialState: UserActionState = { error: "" };

interface UsersClientProps {
  users: UserProfile[];
  currentUserId: string;
}

export default function UsersClient({ users, currentUserId }: UsersClientProps) {
  const [showForm, setShowForm] = useState(false);
  const [state, formAction, pending] = useActionState(inviteUser, initialState);
  const [actionPending, startTransition] = useTransition();
  const [actionMsg, setActionMsg] = useState<{ error?: string; success?: string }>({});
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  function handleRoleToggle(userId: string, currentRole: "admin" | "user") {
    const newRole = currentRole === "admin" ? "user" : "admin";
    setActionMsg({});
    startTransition(async () => {
      const result = await updateRole(userId, newRole);
      setActionMsg(result.error ? { error: result.error } : { success: result.success });
    });
  }

  function handleDelete(userId: string) {
    setActionMsg({});
    setConfirmDelete(null);
    startTransition(async () => {
      const result = await deleteUser(userId);
      setActionMsg(result.error ? { error: result.error } : { success: result.success });
    });
  }

  // Reset form on successful invite
  const formSuccess = state.success && !state.error;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#233B5C] dark:text-zinc-100">
            Users
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Manage team members and roles.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-md bg-[#233B5C] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#1a2d47]"
        >
          <UserPlus className="h-4 w-4" />
          Invite User
        </button>
      </div>

      {/* Action messages */}
      {actionMsg.error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-400">
          {actionMsg.error}
        </div>
      )}
      {actionMsg.success && (
        <div className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-700 dark:bg-green-950 dark:text-green-400">
          {actionMsg.success}
        </div>
      )}

      {/* Invite form */}
      {showForm && (
        <div className="mb-6 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
          <h3 className="mb-3 text-sm font-semibold text-[#233B5C] dark:text-zinc-100">
            Invite New User
          </h3>
          <form action={formAction} className="space-y-3">
            {state.error && (
              <div className="rounded-md bg-red-50 p-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-400">
                {state.error}
              </div>
            )}
            {formSuccess && (
              <div className="rounded-md bg-green-50 p-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-400">
                {state.success}
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input id="full_name" name="full_name" type="text" required className={inputClass} />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Email <span className="text-red-500">*</span>
                </label>
                <input id="email" name="email" type="email" required className={inputClass} />
              </div>
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Role
                </label>
                <select id="role" name="role" defaultValue="user" className={`${inputClass} appearance-auto`}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              disabled={pending}
              className="flex items-center gap-2 rounded-md bg-[#233B5C] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#1a2d47] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              {pending ? "Sending invite..." : "Send Invite"}
            </button>
          </form>
        </div>
      )}

      {/* Users table */}
      <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
        <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
          <thead className="bg-zinc-50 dark:bg-zinc-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Role
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Created
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-700 dark:bg-zinc-900">
            {users.map((u) => {
              const isCurrentUser = u.id === currentUserId;
              return (
                <tr key={u.id} className={isCurrentUser ? "bg-blue-50/50 dark:bg-blue-950/20" : ""}>
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {u.full_name}
                    {isCurrentUser && (
                      <span className="ml-2 text-xs text-zinc-400">(you)</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                    {u.email}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        u.role === "admin"
                          ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                          : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                    {!isCurrentUser && (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleRoleToggle(u.id, u.role)}
                          disabled={actionPending}
                          title={u.role === "admin" ? "Demote to user" : "Promote to admin"}
                          className="rounded p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 disabled:opacity-50 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                        >
                          {u.role === "admin" ? (
                            <ShieldOff className="h-4 w-4" />
                          ) : (
                            <Shield className="h-4 w-4" />
                          )}
                        </button>
                        {confirmDelete === u.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDelete(u.id)}
                              disabled={actionPending}
                              className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDelete(null)}
                              className="rounded px-2 py-1 text-xs text-zinc-500 hover:text-zinc-700"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(u.id)}
                            disabled={actionPending}
                            title="Delete user"
                            className="rounded p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-950 dark:hover:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-zinc-500">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-500">
        {users.length} user{users.length !== 1 ? "s" : ""} total
      </p>
    </div>
  );
}
