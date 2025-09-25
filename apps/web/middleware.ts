import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simple development middleware without authentication
export function middleware(request: NextRequest) {
  // Add mock org context for all requests during development
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-org-id', 'dev-org-123');
  requestHeaders.set('x-org-role', 'admin');
  requestHeaders.set('x-user-id', 'dev-user-123');
  
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};