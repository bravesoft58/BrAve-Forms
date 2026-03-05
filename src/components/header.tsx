"use client";

import { Menu, LogOut } from "lucide-react";

export default function Header({
  fullName,
  email,
  onMenuClick,
}: {
  fullName: string;
  email: string;
  onMenuClick: () => void;
}) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-900 md:px-6">
      <button
        onClick={onMenuClick}
        className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 md:hidden dark:hover:bg-zinc-800"
      >
        <Menu size={20} />
      </button>

      <div className="hidden md:block" />

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {fullName || email}
          </p>
          {fullName && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{email}</p>
          )}
        </div>

        <form action="/auth/signout" method="POST">
          <button
            type="submit"
            className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            title="Log out"
          >
            <LogOut size={20} />
          </button>
        </form>
      </div>
    </header>
  );
}
