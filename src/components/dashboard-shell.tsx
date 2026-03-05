"use client";

import { useState } from "react";
import Sidebar from "./sidebar";
import Header from "./header";

export default function DashboardShell({
  children,
  role,
  fullName,
  email,
}: {
  children: React.ReactNode;
  role: "admin" | "user";
  fullName: string;
  email: string;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      <Sidebar
        role={role}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          fullName={fullName}
          email={email}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
