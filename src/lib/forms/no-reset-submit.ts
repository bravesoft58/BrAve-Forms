import type { FormEvent } from "react";

type FormActionFn = (formData: FormData) => void;

/**
 * Submit handler that runs a useActionState action without React 19's
 * automatic form reset. `<form action={fn}>` resets the form after every
 * action completion, success or not (react/react#29034): controlled selects
 * and radios then show blank while the state they are drawn from, which is
 * what gets sent, keeps the old answers. onSubmit + startTransition is the
 * React team's documented opt-out. BF-66. React-free so it can be unit
 * tested in Node; `useNoResetSubmit` supplies React's startTransition.
 */
export function buildNoResetSubmit(
  action: FormActionFn,
  runInTransition: (fn: () => void) => void,
  readForm: (form: HTMLFormElement) => FormData = (form) => new FormData(form),
  // BF-65: the submit's idempotency key, the same value on every retry.
  clientKey?: () => string,
) {
  return (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = readForm(event.currentTarget);
    if (clientKey) formData.set("client_key", clientKey());
    runInTransition(() => action(formData));
  };
}
