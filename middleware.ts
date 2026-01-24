import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "./lib/server-utils";

/*
Since Server Components can't write cookies, you need middleware to
refresh expired Auth tokens and store them.

The middleware is responsible for:
  1. Refreshing the Auth token (by calling supabase.auth.getUser).
  2. Passing the refreshed Auth token to Server Components, so they don't attempt to refresh the same token themselves. This is accomplished with request.cookies.set.
  3. Passing the refreshed Auth token to the browser, so it replaces the old token. This is accomplished with response.cookies.set.
  4. Enforcing email allowlist: if allowlist exists and user's email is not on it, sign them out and redirect.
*/

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip allowlist check for auth routes, not-allowed page, and API routes
  const publicPaths = ["/auth/", "/auth/not-allowed", "/api/"];
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  // First, refresh the session (this updates cookies)
  // We get the user and supabase client back to avoid re-fetching
  const { response, user, supabase } = await updateSession(request);

  // If on a public path, skip allowlist check
  if (isPublicPath) {
    return response;
  }

  // If user is authenticated, check allowlist and cache role
  if (user && user.email) {
    // Batch both queries together for better performance
    const [allowlistResult, profileResult] = await Promise.all([
      supabase.from("allowed_emails").select("email").ilike("email", user.email).limit(1).maybeSingle(),
      supabase.from("profiles").select("role").eq("id", user.id).single(),
    ]);

    const { data: userAllowed, error: checkError } = allowlistResult;
    const { data: profile } = profileResult;

    // If user's email is not in the allowlist, sign them out and redirect
    if (checkError || !userAllowed) {
      // Create a client that can sign out
      const signOutClient = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
          cookies: {
            get(name: string) {
              return request.cookies.get(name)?.value;
            },
            set(name: string, value: string, options: CookieOptions) {
              response.cookies.set({
                name,
                value,
                ...options,
              });
            },
            remove(name: string, options: CookieOptions) {
              response.cookies.set({
                name,
                value: "",
                ...options,
              });
            },
          },
        },
      );
      await signOutClient.auth.signOut();
      return NextResponse.redirect(new URL("/auth/not-allowed", request.url));
    }

    // Cache user role in response header for efficient access in server components
    // This minimizes database calls - role is queried once per request in middleware
    if (profile?.role) {
      response.headers.set("x-user-role", profile.role);
    }
  }

  return response;
}

export const config = {
  // Matcher so the middleware doesn't run on routes that don't access Supabase.
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
