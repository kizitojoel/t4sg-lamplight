import { createServerSupabaseClient } from "@/lib/server-utils";
import { NextResponse } from "next/server";

type JsonResponse = { error?: string } | { data?: unknown };

type AdminResult =
  | { supabase: ReturnType<typeof createServerSupabaseClient>; response: NextResponse }
  | {
      supabase: ReturnType<typeof createServerSupabaseClient>;
      user: { id: string };
      profile: { email: string; role: string };
    };

async function requireAdmin(): Promise<AdminResult> {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError) {
    return { supabase, response: NextResponse.json({ error: authError.message }, { status: 401 }) };
  }
  if (!user) {
    return { supabase, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("email, role")
    .eq("id", user.id)
    .single();
  if (profileError) {
    return { supabase, response: NextResponse.json({ error: profileError.message }, { status: 403 }) };
  }
  if (!profile || profile.role !== "admin") {
    return { supabase, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { supabase, user, profile };
}

export async function GET() {
  const result = await requireAdmin();
  if ("response" in result) return result.response;

  const { supabase } = result;
  const { data, error } = await supabase.from("allowed_emails").select("*").order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message } satisfies JsonResponse, { status: 500 });
  }

  return NextResponse.json({ data } satisfies JsonResponse);
}

export async function POST(request: Request) {
  const result = await requireAdmin();
  if ("response" in result) return result.response;

  const { supabase, user } = result;
  const body = (await request.json().catch(() => null)) as { email?: string; role?: string } | null;
  const emailRaw = typeof body?.email === "string" ? body.email : "";
  const email = emailRaw.trim().toLowerCase();
  const role = body?.role === "admin" || body?.role === "teacher" ? body.role : "teacher"; // default to teacher

  if (!email) {
    return NextResponse.json({ error: "Email is required" } satisfies JsonResponse, { status: 400 });
  }

  // Insert into allowed_emails (with role if column exists, otherwise just email)
  const insertData = { email, created_by: user.id, role } as { email: string; created_by: string; role?: string };
  // Try to include role if the column exists (will fail gracefully if it doesn't)
  let insertError = null;
  try {
    const result = await supabase.from("allowed_emails").insert(insertData);
    insertError = result.error;
    if (insertError) {
      // If role column doesn't exist, try without it
      if (insertError.message.includes("role") || insertError.code === "42703") {
        const retryResult = await supabase.from("allowed_emails").insert({ email, created_by: user.id });
        insertError = retryResult.error;
        if (insertError) {
          const status = insertError.code === "23505" ? 409 : 500; // unique_violation => conflict
          return NextResponse.json({ error: insertError.message } satisfies JsonResponse, { status });
        }
      } else {
        const status = insertError.code === "23505" ? 409 : 500;
        return NextResponse.json({ error: insertError.message } satisfies JsonResponse, { status });
      }
    }
  } catch {
    // Fallback: try without role
    const result = await supabase.from("allowed_emails").insert({ email, created_by: user.id });
    insertError = result.error;
    if (insertError) {
      const status = insertError.code === "23505" ? 409 : 500;
      return NextResponse.json({ error: insertError.message } satisfies JsonResponse, { status });
    }
  }

  // Update profile if it exists (find by email)
  const { data: existingProfile } = await supabase.from("profiles").select("id").eq("email", email).single();
  if (existingProfile) {
    await supabase.from("profiles").update({ role }).eq("id", existingProfile.id);
  }

  return NextResponse.json({ data: { email, role } } satisfies JsonResponse, { status: 201 });
}

export async function PATCH(request: Request) {
  const result = await requireAdmin();
  if ("response" in result) return result.response;

  const { supabase } = result;
  const body = (await request.json().catch(() => null)) as { email?: string; role?: string } | null;
  const emailRaw = typeof body?.email === "string" ? body.email : "";
  const email = emailRaw.trim().toLowerCase();
  const role = body?.role === "admin" || body?.role === "teacher" ? body.role : null;

  if (!email) {
    return NextResponse.json({ error: "Email is required" } satisfies JsonResponse, { status: 400 });
  }
  if (!role) {
    return NextResponse.json({ error: "Role is required" } satisfies JsonResponse, { status: 400 });
  }

  // Update allowed_emails role if column exists
  // Note: role column may not exist in schema types, so we use type assertion
  try {
    await supabase
      .from("allowed_emails")
      .update({ role } as Record<string, unknown>)
      .eq("email", email);
  } catch {
    // Column might not exist, continue anyway
  }

  // Update profile if it exists
  const { data: existingProfile } = await supabase.from("profiles").select("id").eq("email", email).single();
  if (existingProfile) {
    await supabase.from("profiles").update({ role }).eq("id", existingProfile.id);
  }

  return NextResponse.json({ data: { email, role } } satisfies JsonResponse);
}

export async function DELETE(request: Request) {
  const result = await requireAdmin();
  if ("response" in result) return result.response;

  const { supabase, profile } = result;
  const body = (await request.json().catch(() => null)) as { email?: string } | null;
  const emailRaw = typeof body?.email === "string" ? body.email : "";
  const email = emailRaw.trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ error: "Email is required" } satisfies JsonResponse, { status: 400 });
  }

  if (profile.email.toLowerCase() === email) {
    return NextResponse.json({ error: "Cannot remove your own email" } satisfies JsonResponse, { status: 400 });
  }

  const { error } = await supabase.from("allowed_emails").delete().eq("email", email);
  if (error) {
    return NextResponse.json({ error: error.message } satisfies JsonResponse, { status: 500 });
  }

  return NextResponse.json({ data: { email } } satisfies JsonResponse);
}
