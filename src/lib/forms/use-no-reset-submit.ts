import { startTransition, useMemo, useSyncExternalStore } from "react";
import { buildNoResetSubmit } from "@/lib/forms/no-reset-submit";

const subscribeNever = () => () => {};

/**
 * Submit wiring for the state-backed forms. Use as
 *   const { submit, ready } = useNoResetSubmit(formAction);
 *   <form action={formAction} onSubmit={submit}> ... <button disabled={pending || !ready}>
 *
 * `submit`: after hydration, preventDefault makes react-dom skip the action
 * prop and its automatic reset (react/react#29034); the handler runs the action
 * in a transition instead. BF-66.
 *
 * `ready`: false in the server HTML and until hydration, then true. These forms
 * send one hidden JSON field built from React state, and before hydration it
 * still holds the server-rendered values, so a submit then would save old
 * answers while the screen shows new ones (BF-66 verify round 2, F3). Keeping
 * the single submit button disabled until ready also blocks Enter-key
 * submission. useSyncExternalStore gives false on the server and true on the
 * client without a hydration mismatch.
 */
export function useNoResetSubmit(action: (formData: FormData) => void) {
  const submit = useMemo(() => buildNoResetSubmit(action, startTransition), [action]);
  const ready = useSyncExternalStore(subscribeNever, () => true, () => false);
  return { submit, ready };
}
