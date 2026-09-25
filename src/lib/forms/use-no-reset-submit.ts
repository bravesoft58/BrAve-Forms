import { startTransition, useMemo } from "react";
import { buildNoResetSubmit } from "@/lib/forms/no-reset-submit";

/**
 * Use as `const submit = useNoResetSubmit(formAction)` with
 * `<form action={formAction} onSubmit={submit}>`. Keep the action prop: it is
 * the server-action fallback used before hydration. After hydration the
 * handler's preventDefault makes react-dom skip the action (and its automatic
 * reset), and the handler runs it instead. BF-66.
 */
export function useNoResetSubmit(action: (formData: FormData) => void) {
  return useMemo(() => buildNoResetSubmit(action, startTransition), [action]);
}
