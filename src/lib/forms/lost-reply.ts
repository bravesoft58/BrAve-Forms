export const LOST_REPLY_ERROR =
  "The connection dropped before the server replied, so this may already be saved. " +
  "Press Submit again: it will not be saved twice.";

type FormAction<S> = (state: S, formData: FormData) => Promise<S>;

/**
 * Wraps a server action given to useActionState so a lost reply (network
 * drop, server error page) comes back as an error message on the form instead
 * of a thrown error. A thrown error would replace the page with Next's
 * "This page couldn't load", unmounting the form and its idempotency key, so
 * the user's reload would submit a duplicate (BF-65, seen on the preview).
 * Kept on the form, the key survives and the retry is deduplicated.
 *
 * `rethrowInternal` must re-raise Next's own control-flow errors (the
 * redirect after a successful save); the client passes unstable_rethrow.
 * React-free so it can be unit tested in Node.
 */
export function catchLostReply<S extends { error: string }>(
  action: FormAction<S>,
  rethrowInternal: (error: unknown) => void,
): FormAction<S> {
  return async (state, formData) => {
    try {
      return await action(state, formData);
    } catch (error) {
      rethrowInternal(error);
      console.error("Form save lost its reply", error);
      return { ...state, error: LOST_REPLY_ERROR };
    }
  };
}
