import { NextResponse, type NextRequest } from "next/server";
import { openSessionForToken } from "@/lib/inspector/session";
import {
  INSPECTOR_COOKIE_PATH,
  INSPECTOR_SESSION_COOKIE,
} from "@/lib/inspector/constants";

// BF-56: the URL encoded in the printed QR. Scanning it opens a short session
// and redirects to /inspector, so the browser never stays on the QR URL and a
// refresh after expiry cannot re-enter. Route Handler, not a page: cookies can
// only be set here or in a Server Action (Next.js cookies() docs).
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const session = await openSessionForToken(token);

  const target = new URL(INSPECTOR_COOKIE_PATH, request.url);
  if (!session) target.searchParams.set("link", "invalid");

  const response = NextResponse.redirect(target, 303);
  response.headers.set("Cache-Control", "no-store");

  if (session) {
    // 12 h, or less when a legacy token expires sooner: the cookie never
    // outlives the session row it points at.
    const maxAge = Math.max(1, Math.floor((session.expiresAt.getTime() - Date.now()) / 1000));
    response.cookies.set(INSPECTOR_SESSION_COOKIE, session.id, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: INSPECTOR_COOKIE_PATH,
      maxAge,
    });
  } else {
    // A bad scan must not leave an older session for another project in place.
    response.cookies.delete({ name: INSPECTOR_SESSION_COOKIE, path: INSPECTOR_COOKIE_PATH });
  }
  return response;
}
