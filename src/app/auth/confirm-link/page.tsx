import Link from "next/link";

type SearchParams = Promise<{
  token_hash?: string;
  type?: string;
  next?: string;
}>;

export default async function ConfirmLinkPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { token_hash, type, next } = await searchParams;

  if (!token_hash || !type) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <h1 className="text-lg font-semibold text-red-900">Invalid link</h1>
          <p className="mt-2 text-sm text-red-800">
            This confirmation link is missing required parameters.
          </p>
          <Link
            href="/login"
            className="mt-4 inline-block text-sm font-medium text-red-900 underline"
          >
            Back to login
          </Link>
        </div>
      </main>
    );
  }

  const params = new URLSearchParams({ token_hash, type });
  if (next) params.set("next", next);
  const confirmHref = `/auth/confirm?${params.toString()}`;

  const heading =
    type === "recovery"
      ? "Reset your password"
      : type === "invite"
        ? "Accept your invitation"
        : "Confirm your email";

  const buttonLabel =
    type === "recovery"
      ? "Continue to reset password"
      : type === "invite"
        ? "Accept invite"
        : "Confirm email";

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">{heading}</h1>
        <p className="mt-3 text-sm text-slate-600">
          For your security, click the button below to continue. This extra step
          prevents automated email scanners from using your one-time link before
          you do.
        </p>
        <Link
          href={confirmHref}
          prefetch={false}
          className="mt-6 inline-flex w-full items-center justify-center rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
        >
          {buttonLabel}
        </Link>
      </div>
    </main>
  );
}
