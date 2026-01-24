import { createServerSupabaseClient, requireAdminAPI } from "@/lib/server-utils";
import { NextResponse } from "next/server";

type JsonResponse = { error?: string } | { data?: unknown };

type AdminContext = {
  supabase: ReturnType<typeof import("@/lib/server-utils").createServerSupabaseClient>;
  user: { id: string };
  profile: { id: string; email: string; role: "admin" };
  emailLower: string; // Pre-computed lowercase email for performance
};

/**
 * Validates admin access and returns admin context or error response
 * Uses the optimized requireAdminAPI helper from server-utils
 */
async function requireAdmin(): Promise<AdminContext | NextResponse> {
  const result = await requireAdminAPI();

  if (result instanceof NextResponse) {
    return result;
  }

  // Pre-compute lowercase email for performance (used in DELETE)
  return {
    ...result,
    emailLower: result.profile.email.toLowerCase(),
  };
}

/**
 * Parses and validates email from request body
 */
async function parseEmailFromBody(request: Request): Promise<string | null> {
  try {
    const body = (await request.json()) as { email?: unknown };
    if (typeof body?.email === "string") {
      const email = body.email.trim().toLowerCase();
      return email || null;
    }
  } catch {
    // Invalid JSON or missing body
  }
  return null;
}

/**
 * Parses role from request body, validates it, and returns default if invalid
 */
function parseRole(body: { role?: unknown }): "admin" | "teacher" | null {
  if (body.role === "admin" || body.role === "teacher") {
    return body.role;
  }
  return null;
}

/**
 * Parses role with a default value (for POST requests)
 */
function parseRoleWithDefault(body: { role?: unknown }): "admin" | "teacher" {
  const role = parseRole(body);
  return role ?? "teacher";
}

/**
 * Handles database errors and returns appropriate HTTP status
 */
function handleDbError(error: { code?: string; message: string }): { status: number; message: string } {
  // PostgreSQL unique violation error code
  if (error.code === "23505") {
    return { status: 409, message: "Email already exists" };
  }
  return { status: 500, message: error.message };
}

/**
 * Updates user profile role if profile exists (optimized: single UPDATE query)
 * Returns true if profile was updated, false if profile doesn't exist
 */
async function updateProfileRole(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  email: string,
  role: "admin" | "teacher",
): Promise<{ updated: boolean; error?: string }> {
  // Use UPDATE directly with WHERE clause - more efficient than SELECT then UPDATE
  const { data, error } = await supabase.from("profiles").update({ role }).eq("email", email).select("id").single();

  if (error) {
    // PGRST116: no rows returned (profile doesn't exist) - not an error, just no update
    if (error.code === "PGRST116") {
      return { updated: false };
    }
    return { updated: false, error: error.message };
  }

  return { updated: data !== null };
}

export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { supabase } = admin;
  // Select only needed columns for better performance
  const { data, error } = await supabase
    .from("allowed_emails")
    .select("id, email, role, created_at, created_by")
    .order("created_at", { ascending: false });

  if (error) {
    const { status, message } = handleDbError(error);
    return NextResponse.json({ error: message } satisfies JsonResponse, { status });
  }

  return NextResponse.json({ data } satisfies JsonResponse);
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { supabase, user } = admin;

  // Parse request body
  let body: { email?: unknown; role?: unknown };
  try {
    body = (await request.json()) as { email?: unknown; role?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" } satisfies JsonResponse, { status: 400 });
  }

  // Validate and normalize email
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email) {
    return NextResponse.json({ error: "Email is required" } satisfies JsonResponse, { status: 400 });
  }

  // Parse and validate role (default to teacher)
  const role = parseRoleWithDefault(body);

  // Insert into allowed_emails with the role that should be applied on first login
  const { error: insertError } = await supabase.from("allowed_emails").insert({ email, role, created_by: user.id });

  if (insertError) {
    const { status, message } = handleDbError(insertError);
    return NextResponse.json({ error: message } satisfies JsonResponse, { status });
  }

  // Update profile role if profile exists (optimized: single UPDATE query)
  const profileUpdate = await updateProfileRole(supabase, email, role);
  if (profileUpdate.error) {
    // Log error but don't fail the request since allowed_email was created successfully
    console.error("Failed to update profile role:", profileUpdate.error);
  }

  return NextResponse.json({ data: { email, role } } satisfies JsonResponse, { status: 201 });
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { supabase } = admin;

  // Parse request body
  let body: { email?: unknown; role?: unknown };
  try {
    body = (await request.json()) as { email?: unknown; role?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" } satisfies JsonResponse, { status: 400 });
  }

  // Validate and normalize email
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email) {
    return NextResponse.json({ error: "Email is required" } satisfies JsonResponse, { status: 400 });
  }

  // Validate role (required for PATCH)
  const role = parseRole(body);
  if (!role) {
    return NextResponse.json({ error: "Role is required and must be 'admin' or 'teacher'" } satisfies JsonResponse, {
      status: 400,
    });
  }

  // Verify email exists in allowed_emails before updating profile
  const { data: allowedEmail, error: checkError } = await supabase
    .from("allowed_emails")
    .select("email")
    .eq("email", email)
    .single();

  if (checkError || !allowedEmail) {
    return NextResponse.json({ error: "Email not found in allowed emails" } satisfies JsonResponse, { status: 404 });
  }

  // Update role on allowlist entry so the source of truth stays in sync
  const { error: updateAllowlistError } = await supabase.from("allowed_emails").update({ role }).eq("email", email);
  if (updateAllowlistError) {
    const { status, message } = handleDbError(updateAllowlistError);
    return NextResponse.json({ error: message } satisfies JsonResponse, { status });
  }

  // Update profile role (optimized: single UPDATE query)
  const profileUpdate = await updateProfileRole(supabase, email, role);
  if (profileUpdate.error) {
    const { status, message } = handleDbError({ code: undefined, message: profileUpdate.error });
    return NextResponse.json({ error: message } satisfies JsonResponse, { status });
  }

  if (!profileUpdate.updated) {
    // Profile doesn't exist yet - this is okay, role will be set when user signs up
    // Still return success since the allowed_email exists and role is valid
  }

  return NextResponse.json({ data: { email, role } } satisfies JsonResponse);
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { supabase, emailLower } = admin;

  // Parse and validate email
  const email = await parseEmailFromBody(request);
  if (!email) {
    return NextResponse.json({ error: "Email is required" } satisfies JsonResponse, { status: 400 });
  }

  // Prevent self-deletion (using pre-computed lowercase email)
  if (emailLower === email) {
    return NextResponse.json({ error: "Cannot remove your own email" } satisfies JsonResponse, { status: 400 });
  }

  // Delete from allowed_emails
  const { error } = await supabase.from("allowed_emails").delete().eq("email", email);
  if (error) {
    const { status, message } = handleDbError(error);
    return NextResponse.json({ error: message } satisfies JsonResponse, { status });
  }

  return NextResponse.json({ data: { email } } satisfies JsonResponse);
}
