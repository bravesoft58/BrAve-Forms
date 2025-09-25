"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.middleware = middleware;
const server_1 = require("next/server");
function middleware(request) {
    // Clone the response
    const response = server_1.NextResponse.next();
    // Add security headers
    const headers = response.headers;
    // Content Security Policy
    headers.set("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; frame-src 'self'; object-src 'none';");
    // HTTP Strict Transport Security
    headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
    // X-Frame-Options to prevent clickjacking
    headers.set("X-Frame-Options", "SAMEORIGIN");
    // X-Content-Type-Options to prevent MIME sniffing
    headers.set("X-Content-Type-Options", "nosniff");
    // X-XSS-Protection
    headers.set("X-XSS-Protection", "1; mode=block");
    // Referrer Policy
    headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    // Permissions Policy
    headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), interest-cohort=()");
    return response;
}
exports.config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        "/((?!_next/static|_next/image|favicon.ico).*)",
    ],
};
//# sourceMappingURL=middleware.js.map