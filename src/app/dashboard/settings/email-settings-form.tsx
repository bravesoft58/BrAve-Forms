"use client";

import { startTransition, useActionState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { Loader2, Mail, Save } from "lucide-react";
import { buildNoResetSubmit } from "@/lib/forms/no-reset-submit";
import type { EmailSettingsView } from "@/lib/queries/email-settings";
import { saveEmailSettings, sendTestEmail, type EmailSettingsState } from "./actions";

const inputClass =
  "mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#5C6F8A] focus:outline-none focus:ring-1 focus:ring-[#5C6F8A] dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100";
const labelClass = "block text-sm font-medium text-zinc-700 dark:text-zinc-300";
const buttonClass =
  "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium shadow-sm disabled:cursor-not-allowed disabled:opacity-50";

const initialState: EmailSettingsState = {};

function Notice({ state }: { state: EmailSettingsState }) {
  if (state.error) {
    return <p className="rounded-md bg-red-50 p-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-400">{state.error}</p>;
  }
  if (state.message) {
    return <p className="rounded-md bg-green-50 p-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-400">{state.message}</p>;
  }
  return null;
}

function Field(props: {
  name: string;
  label: string;
  hint?: string;
  errors?: string[];
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={props.name} className={labelClass}>
        {props.label}
      </label>
      {props.children}
      {props.hint && <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{props.hint}</p>}
      {props.errors?.map((e) => (
        <p key={e} className="mt-1 text-xs text-red-600">
          {e}
        </p>
      ))}
    </div>
  );
}

export default function EmailSettingsForm({ settings }: { settings: EmailSettingsView | null }) {
  const [saveState, saveAction, saving] = useActionState(saveEmailSettings, initialState);
  const [testState, testAction, testing] = useActionState(sendTestEmail, initialState);
  // No automatic reset (BF-66): a refused save keeps what the admin typed.
  const submit = useMemo(() => buildNoResetSubmit(saveAction, startTransition), [saveAction]);
  const secretRef = useRef<HTMLInputElement>(null);
  const errors = saveState.fieldErrors ?? {};

  // The secret is write-only: clear it from the page once it is saved.
  useEffect(() => {
    if (saveState.message && secretRef.current) secretRef.current.value = "";
  }, [saveState]);

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <h2 className="text-lg font-semibold text-[#233B5C] dark:text-zinc-100">Email alerts (Microsoft 365)</h2>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        BrAve Forms sends alerts from a mailbox in your own Microsoft 365. Your Microsoft 365 administrator sets it up
        first:{" "}
        <Link href="/dashboard/settings/email-setup" className="text-[#233B5C] underline dark:text-zinc-200">
          setup steps
        </Link>
        .
      </p>

      <form action={saveAction} onSubmit={submit} className="mt-4 space-y-3">
        <Notice state={saveState} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field name="tenant_id" label="Tenant ID" hint="Directory (tenant) ID" errors={errors.tenant_id}>
            <input id="tenant_id" name="tenant_id" defaultValue={settings?.tenant_id ?? ""} required className={inputClass} />
          </Field>
          <Field name="client_id" label="Client ID" hint="Application (client) ID" errors={errors.client_id}>
            <input id="client_id" name="client_id" defaultValue={settings?.client_id ?? ""} required className={inputClass} />
          </Field>
          <Field name="sender_mailbox" label="Sender mailbox" errors={errors.sender_mailbox}>
            <input
              id="sender_mailbox"
              name="sender_mailbox"
              type="email"
              defaultValue={settings?.sender_mailbox ?? ""}
              required
              className={inputClass}
            />
          </Field>
          <Field
            name="client_secret"
            label="Client secret"
            hint={settings ? "Set. Leave blank to keep it, or paste a new one." : "Paste the secret's Value."}
            errors={errors.client_secret}
          >
            <input
              ref={secretRef}
              id="client_secret"
              name="client_secret"
              type="password"
              autoComplete="off"
              required={!settings}
              className={inputClass}
            />
          </Field>
          <Field name="client_secret_expires_on" label="Secret expires on" errors={errors.client_secret_expires_on}>
            <input
              id="client_secret_expires_on"
              name="client_secret_expires_on"
              type="date"
              defaultValue={settings?.client_secret_expires_on ?? ""}
              required
              className={inputClass}
            />
          </Field>
        </div>
        <button type="submit" disabled={saving} className={`${buttonClass} bg-[#233B5C] text-white hover:bg-[#1a2d47]`}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving..." : "Save"}
        </button>
      </form>

      {settings && (
        <form action={testAction} className="mt-6 space-y-2 border-t border-zinc-200 pt-4 dark:border-zinc-700">
          <Notice state={testState} />
          {settings.last_test_at && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Last test {new Date(settings.last_test_at).toLocaleString("en-US", { timeZone: "America/Los_Angeles" })}:{" "}
              {settings.last_test_ok ? "sent" : `failed. ${settings.last_test_error ?? ""}`}
            </p>
          )}
          <button
            type="submit"
            disabled={testing}
            className={`${buttonClass} border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200`}
          >
            {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            {testing ? "Sending..." : "Send test email"}
          </button>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Sends to your own address from the sender mailbox.</p>
        </form>
      )}
    </section>
  );
}
