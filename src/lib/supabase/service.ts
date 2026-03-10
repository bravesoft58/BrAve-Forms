import { createClient as supabaseCreateClient } from "@supabase/supabase-js";

/**
 * Service role client — bypasses RLS. Server-side only.
 * Used for inspector portal queries where there is no auth session.
 */
export function createServiceClient() {
  return supabaseCreateClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
