// Export auth as proxy for Next.js 16 (replaces middleware.ts)
// This keeps sessions alive by updating the session expiry on each request
export { auth as proxy } from "@/auth";

// Configure which routes the proxy should run on
// Exclude static assets, API routes, and public files
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sw.js, manifest, icons (public files)
     * - api routes (handled separately)
     */
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest|icon-|.*\\.png$|api).*)",
  ],
};
