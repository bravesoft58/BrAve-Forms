"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { sameFormSnapshot, snapshotForm, type FormSnapshot } from "@/lib/forms/form-snapshot";

const secondaryClass =
  "rounded-md border border-zinc-300 bg-white px-6 py-2 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-[#5C6F8A] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700";
const discardClass =
  "rounded-md bg-red-600 px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

/**
 * Cancel for every form (BF-75). Render it inside the <form>, next to Submit.
 * An untouched form leaves for `href` straight away; a changed one asks
 * "Discard your changes?" first, inline rather than a browser dialog so it
 * looks and behaves the same on iPhone and Android. "Changed" means the form
 * would now submit something different from what it held when the page became
 * interactive (`ready` from useNoResetSubmit). `disabled` is the form's
 * pending state: nothing here can be used while a save is in flight.
 */
export default function FormCancel({
  href,
  ready,
  disabled = false,
}: {
  href: string;
  ready: boolean;
  disabled?: boolean;
}) {
  const router = useRouter();
  const rowRef = useRef<HTMLSpanElement>(null);
  const keepRef = useRef<HTMLButtonElement>(null);
  const baseline = useRef<FormSnapshot | null>(null);
  const [confirming, setConfirming] = useState(false);

  const form = () => rowRef.current?.closest("form") ?? null;

  useEffect(() => {
    const el = form();
    if (ready && el && !baseline.current) baseline.current = snapshotForm(el);
  }, [ready]);

  useEffect(() => {
    if (confirming) keepRef.current?.focus();
  }, [confirming]);

  function cancel() {
    const el = form();
    const unchanged = !!baseline.current && !!el && sameFormSnapshot(baseline.current, snapshotForm(el));
    if (unchanged) router.push(href);
    else setConfirming(true);
  }

  return (
    <span ref={rowRef} className="contents">
      {confirming ? (
        <span role="group" aria-label="Discard your changes?" className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Discard your changes?</span>
          <button type="button" ref={keepRef} onClick={() => setConfirming(false)} disabled={disabled} className={secondaryClass}>
            Keep editing
          </button>
          <button type="button" onClick={() => router.push(href)} disabled={disabled} className={discardClass}>
            Discard
          </button>
        </span>
      ) : (
        <button type="button" onClick={cancel} disabled={disabled || !ready} className={secondaryClass}>
          Cancel
        </button>
      )}
    </span>
  );
}
