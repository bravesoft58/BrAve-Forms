-- BF-74: per-organization email settings (send through the customer's Microsoft 365).
-- Pair: supabase/migrations/_rollback/20261008164239_rollback.sql
--
-- One row per organization. The org admin enters the Microsoft Entra app
-- registration (tenant ID, client ID, client secret, secret expiry) and the
-- sender mailbox on /dashboard/settings; the app then sends through Microsoft
-- Graph sendMail (src/lib/email/send-mail.ts).
--
-- The client secret is a credential into the customer's company email. It is
-- encrypted in the app (AES-256-GCM, key EMAIL_SETTINGS_KEY held only in
-- Vercel, the organization id bound in as associated data) before it reaches
-- this table, so a database read alone does not reveal it. Supabase Vault was
-- considered and not used: its plaintext is readable through
-- vault.decrypted_secrets by any database superuser, which would put the key
-- and the ciphertext behind the same door.
--
-- Access: RLS on with no policies, and no privileges for anon or
-- authenticated. Only the service client reads or writes this table, after the
-- settings actions confirm is_org_admin for the caller's organization. Per the
-- BF-60 convention, service_role is granted exactly what it uses.

CREATE TABLE public.organization_email_settings (
  org_id                   uuid PRIMARY KEY REFERENCES public.organizations (id) ON DELETE CASCADE,
  provider                 text NOT NULL DEFAULT 'microsoft365' CHECK (provider IN ('microsoft365')),
  tenant_id                text NOT NULL,
  client_id                text NOT NULL,
  sender_mailbox           text NOT NULL,
  client_secret_ciphertext text NOT NULL,
  client_secret_expires_on date NOT NULL,
  last_test_at             timestamptz,
  last_test_ok             boolean,
  last_test_error          text,
  updated_by               uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  updated_at               timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER organization_email_settings_updated_at
  BEFORE UPDATE ON public.organization_email_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.organization_email_settings ENABLE ROW LEVEL SECURITY;

-- Default privileges already grant nothing (BF-60); the revoke states the
-- intent in the file and holds even if a default is ever loosened again.
REVOKE ALL ON TABLE public.organization_email_settings FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.organization_email_settings TO service_role;
