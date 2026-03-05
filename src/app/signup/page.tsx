"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signup, type AuthState } from "./actions";

const initialState: AuthState = { error: "" };

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signup, initialState);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="w-full max-w-sm space-y-6 rounded-lg border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#233B5C] dark:text-zinc-100">
            Create account
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Sign up for BrAve Forms
          </p>
        </div>

        {state.error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-400">
            {state.error}
          </div>
        )}

        <form action={formAction} className="space-y-4">
          <div>
            <label
              htmlFor="full_name"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Full name
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              required
              autoComplete="name"
              className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#5C6F8A] focus:outline-none focus:ring-1 focus:ring-[#5C6F8A] dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

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

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#5C6F8A] focus:outline-none focus:ring-1 focus:ring-[#5C6F8A] dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <p className="mt-1 text-xs text-zinc-400">Minimum 6 characters</p>
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md bg-[#233B5C] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#1a2d47] focus:outline-none focus:ring-2 focus:ring-[#5C6F8A] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-[#233B5C] hover:text-[#5C6F8A]"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
