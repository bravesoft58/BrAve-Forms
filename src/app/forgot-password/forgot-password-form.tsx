"use client";

import { useActionState } from "react";
import Link from "next/link";
import { resetPassword, type ForgotPasswordState } from "./actions";

const initialState: ForgotPasswordState = { error: "" };

export default function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(resetPassword, initialState);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="w-full max-w-sm space-y-6 rounded-lg border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#233B5C] dark:text-zinc-100">
            Reset Password
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        {state.error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-400">
            {state.error}
          </div>
        )}
        {state.success && (
          <div className="rounded-md bg-green-50 p-3 text-sm text-green-700 dark:bg-green-950 dark:text-green-400">
            {state.success}
          </div>
        )}

        <form action={formAction} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#5C6F8A] focus:outline-none focus:ring-1 focus:ring-[#5C6F8A] dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md bg-[#233B5C] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#1a2d47] focus:outline-none focus:ring-2 focus:ring-[#5C6F8A] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          <Link
            href="/login"
            className="font-medium text-[#233B5C] hover:text-[#5C6F8A]"
          >
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
