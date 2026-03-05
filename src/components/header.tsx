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
    <header className="flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-4 md:px-6">
      <button
        onClick={onMenuClick}
        className="rounded-md p-2 text-[#5C6F8A] hover:bg-zinc-100 md:hidden"
      >
        <Menu size={20} />
      </button>

      <div className="hidden md:block" />

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-[#233B5C]">
            {fullName || email}
          </p>
          {fullName && (
            <p className="text-xs text-[#5C6F8A]">{email}</p>
          )}
        </div>

        <form action="/auth/signout" method="POST">
          <button
            type="submit"
            className="rounded-md p-2 text-[#5C6F8A] hover:bg-zinc-100 hover:text-[#233B5C]"
            title="Log out"
          >
            <LogOut size={20} />
          </button>
        </form>
      </div>
    </header>
  );
}
