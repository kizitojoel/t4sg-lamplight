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

    // After successful session exchange, sync role from allowed_emails
    // This ensures existing users get their role updated if it changed in allowed_emails
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.email) {
      // Check allowed_emails for this email
      // Try to get role, but handle case where role column might not exist
      const { data: allowedEmail, error: allowedError } = await supabase
        .from("allowed_emails")
        .select("role")
        .eq("email", user.email.toLowerCase())
        .maybeSingle();

      // If email is in allowed_emails, update profile role
      if (allowedEmail && !allowedError) {
        const role = ((allowedEmail as { role?: string }).role as "admin" | "teacher") || "teacher";

        // Check if profile exists first
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id, role")
          .eq("id", user.id)
          .maybeSingle();

        // Only update if profile exists and role is different
        if (existingProfile && existingProfile.role !== role) {
          const { error: updateError } = await supabase
            .from("profiles")
            .update({ role })
            .eq("id", user.id);

          // Log error if update fails (RLS might block it, but trigger should handle it)
          if (updateError) {
            console.error("Failed to update profile role in callback:", updateError.message);
            // Don't block login - the trigger should have set it correctly on signup
          }
        }
      }
      // If not in allowed_emails, middleware will handle blocking them
    }

    return NextResponse.redirect(`${origin}${next}`);
  }

  // fallback: redirect to error page
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
