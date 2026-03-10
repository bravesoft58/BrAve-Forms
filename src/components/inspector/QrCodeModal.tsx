"use client";

import { useEffect, useCallback, useState, useTransition } from "react";
import QRCode from "react-qr-code";
import { X, QrCode, Copy, Check } from "lucide-react";
import { generateQrToken } from "@/app/dashboard/projects/actions";

export default function QrCodeModal({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const siteUrl =
    typeof window !== "undefined"
      ? process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
      : "";
  const inspectorUrl = token ? `${siteUrl}/inspector/${token}` : "";

  function handleOpen() {
    setOpen(true);
    setError("");

    if (!token) {
      startTransition(async () => {
        const result = await generateQrToken(projectId);
        if (result.error) {
          setError(result.error);
        } else if (result.token) {
          setToken(result.token);
        }
      });
    }
  }

  const handleClose = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, handleClose]);

  async function handleCopy() {
    if (!inspectorUrl) return;
    await navigator.clipboard.writeText(inspectorUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center gap-2 rounded-md border border-zinc-300 px-3 py-1 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        <QrCode className="h-4 w-4" />
        Inspector QR
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
          <div className="relative w-full max-w-sm rounded-xl bg-white p-6 shadow-xl dark:bg-zinc-900">
            <button
              type="button"
              onClick={handleClose}
              className="absolute right-3 top-3 rounded-md p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Inspector QR Code
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Scan this code on-site for read-only access. Valid for 30 days.
            </p>

            {error && (
              <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
            )}

            {isPending && (
              <div className="mt-6 flex justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-[#233B5C]" />
              </div>
            )}

            {token && !isPending && (
              <div className="mt-4 space-y-4">
                <div className="flex justify-center rounded-lg bg-white p-4">
                  <QRCode value={inspectorUrl} size={200} />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={inspectorUrl}
                    className="flex-1 truncate rounded-md border border-zinc-300 bg-zinc-50 px-3 py-2 text-xs text-zinc-600 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                  />
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1 rounded-md bg-[#233B5C] px-3 py-2 text-xs font-medium text-white hover:bg-[#1a2d47]"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
