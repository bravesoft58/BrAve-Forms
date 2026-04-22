import { type EmailOtpType } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next");

  const redirectTo = request.nextUrl.clone();
  redirectTo.searchParams.delete("code");
  redirectTo.searchParams.delete("token_hash");
  redirectTo.searchParams.delete("type");
  redirectTo.searchParams.delete("next");

  // OTP flow — default path. Email templates use token_hash + type because
  // PKCE breaks when corporate email scanners pre-fetch the link or the user
  // opens it in a different browser than where the reset was requested.
  if (token_hash && type) {
    redirectTo.pathname = next || (type === "recovery" ? "/reset-password" : "/dashboard");
    const response = NextResponse.redirect(redirectTo);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.verifyOtp({ type, token_hash });

    if (!error) {
      return response;
    }
    console.error("verifyOtp failed:", error.message);
  }

  // PKCE flow — kept for forward compat (OAuth, magic links). Not used by
  // password reset / signup / invite templates as of BF-29.
  if (code) {
    redirectTo.pathname = next || "/dashboard";
    const response = NextResponse.redirect(redirectTo);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return response;
    }
    console.error("exchangeCodeForSession failed:", error.message);
  }

  redirectTo.pathname = "/login";
  redirectTo.searchParams.set("error", "Invalid or expired confirmation link.");
  return NextResponse.redirect(redirectTo);
}
