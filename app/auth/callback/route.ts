import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies as nextCookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard/students/";

  if (code) {
    const cookieStore = await nextCookies(); // ✅ must await
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value ?? null;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: "", ...options });
          },
        },
      },
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(`${origin}/auth/auth-code-error`);
    }

    // After successful session exchange, ensure profile exists and sync role from allowed_emails
    // This handles cases where:
    // 1. User was added to allowlist before signing up (profile doesn't exist yet)
    // 2. Existing user's role changed in allowed_emails
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.email) {
      // Check allowed_emails for this email to get initial role
      const { data: allowedEmail } = await supabase
        .from("allowed_emails")
        .select("role")
        .ilike("email", user.email)
        .maybeSingle();

      // If user is not on the allowlist, sign them out and redirect

      if (!allowedEmail) {
        await supabase.auth.signOut();

        console.log("You are being signed out");
        console.log(allowedEmail);

        // This is where I'm being signed out, so my email is not on the
        return NextResponse.redirect(`${origin}/auth/not-allowed`);
      }

      // Determine role from allowed_emails
      const role = allowedEmail.role as "admin" | "teacher";

      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("id", user.id)
        .maybeSingle();

      if (!existingProfile) {
        // Profile doesn't exist - create it with role from allowed_emails (or default)
        const username = user.email.substring(0, user.email.indexOf("@")) || user.email;
        const { error: createError } = await supabase.from("profiles").insert({
          id: user.id,
          email: user.email,
          display_name: username,
          biography: null,
          role,
        });

        // Error silently ignored - RLS might block it, but trigger should handle it
        // Don't block login - the trigger should have set it correctly on signup
        if (createError) {
          // Error logged but not blocking login flow
        }
      } else if (existingProfile.role !== role) {
        // Profile exists but role is different - update it
        const { error: updateError } = await supabase.from("profiles").update({ role }).eq("id", user.id);

        // Error silently ignored - RLS might block it, but trigger should handle it
        // Don't block login - the trigger should have set it correctly on signup
        if (updateError) {
          // Error logged but not blocking login flow
        }
      }
    }

    return NextResponse.redirect(`${origin}${next}`);
  }

  // fallback: redirect to error page
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
