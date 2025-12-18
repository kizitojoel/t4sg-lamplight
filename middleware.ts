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
  const response = await updateSession(request);

  // If on a public path, skip allowlist check
  if (isPublicPath) {
    return response;
  }

  // Create a supabase client to check allowlist (using cookies from request)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set() {
          // No-op in middleware for read-only operations
        },
        remove() {
          // No-op in middleware for read-only operations
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If user is authenticated, check allowlist
  if (user && user.email) {
    // Check if allowlist has any entries
    const { data: allowlistEntries, error: allowlistError } = await supabase
      .from("allowed_emails")
      .select("email")
      .limit(1);

    // If allowlist exists and has entries, check if user's email is allowed
    if (!allowlistError && allowlistEntries && allowlistEntries.length > 0) {
      const { data: userAllowed, error: checkError } = await supabase
        .from("allowed_emails")
        .select("email")
        .eq("email", user.email.toLowerCase())
        .limit(1)
        .single();

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
