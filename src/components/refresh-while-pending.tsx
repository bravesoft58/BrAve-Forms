"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const REFRESH_MS = 5000;

/**
 * Re-renders the server page every few seconds while it is mounted. Render it
 * only while something on the page is still in flight (BF-72: the sheen/plume
 * alert email is sent after the save's response), so the result, including a
 * failure and who to call, shows without a manual reload. The server stops
 * rendering it once the result is known or the pending window has passed,
 * which unmounts it and clears the timer.
 */
export default function RefreshWhilePending() {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), REFRESH_MS);
    return () => clearInterval(id);
  }, [router]);
  return null;
}
