import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Check if auth should be skipped (local development)
const skipAuth =
  process.env.NEXT_PUBLIC_SKIP_CLERK_AUTH === 'true' || process.env.SKIP_CLERK_AUTH === 'true';

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/', // Landing page
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/inspector/(.*)', // QR code inspector portal is public
  '/api/webhooks(.*)', // Webhooks don't need auth
]);

export default clerkMiddleware(async (auth, request) => {
  // Skip all auth in local development mode
  if (skipAuth) {
    return NextResponse.next();
  }

  // Protect all routes except public ones
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
