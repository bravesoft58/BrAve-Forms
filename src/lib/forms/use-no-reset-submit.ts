import { startTransition, useMemo } from "react";
import { buildNoResetSubmit } from "@/lib/forms/no-reset-submit";

/** Use as `<form onSubmit={useNoResetSubmit(formAction)}>` in place of `action={formAction}`. */
export function useNoResetSubmit(action: (formData: FormData) => void) {
  return useMemo(() => buildNoResetSubmit(action, startTransition), [action]);
}
