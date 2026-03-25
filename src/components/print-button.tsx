"use client";

import { Download } from "lucide-react";

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="flex items-center gap-2 rounded-md bg-[#233B5C] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#1a2d47] print:hidden"
    >
      <Download className="h-4 w-4" />
      Download PDF
    </button>
  );
}
