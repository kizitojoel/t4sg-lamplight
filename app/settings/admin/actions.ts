"use server";

import { createServerSupabaseClient, requireAdmin } from "@/lib/server-utils";
import { revalidatePath } from "next/cache";

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============ PROGRAMS ============

export async function getPrograms() {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.from("program").select("id, name, active, created_at").order("name");

  if (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to fetch programs:", error.message);
    return [];
  }
  return data ?? [];
}

export async function createProgram(name: string): Promise<ActionResult<{ id: string }>> {
  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.from("program").insert({ name, active: true }).select("id").single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/settings/admin");
  return { success: true, data: { id: data.id } };
}

export async function updateProgram(id: string, updates: { name?: string; active?: boolean }): Promise<ActionResult> {
  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("program").update(updates).eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/settings/admin");
  return { success: true };
}

export async function deleteProgram(id: string): Promise<ActionResult> {
  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = createServerSupabaseClient();

  // Check if any students use this program
  const { count } = await supabase.from("students").select("id", { count: "exact", head: true }).eq("program_id", id);

  if (count && count > 0) {
    return {
      success: false,
      error: `Cannot delete: ${count} student(s) are assigned to this program. Deactivate it instead.`,
    };
  }

  const { error } = await supabase.from("program").delete().eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/settings/admin");
  return { success: true };
}

// ============ COURSES ============

export async function getCourses() {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.from("course_placement").select("id, name, active, created_at").order("name");

  if (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to fetch courses:", error.message);
    return [];
  }
  return data ?? [];
}

export async function createCourse(name: string): Promise<ActionResult<{ id: string }>> {
  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.from("course_placement").insert({ name, active: true }).select("id").single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/settings/admin");
  return { success: true, data: { id: data.id } };
}

export async function updateCourse(id: string, updates: { name?: string; active?: boolean }): Promise<ActionResult> {
  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("course_placement").update(updates).eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/settings/admin");
  return { success: true };
}

export async function deleteCourse(id: string): Promise<ActionResult> {
  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = createServerSupabaseClient();

  // Check if any students use this course
  const { count } = await supabase
    .from("students")
    .select("id", { count: "exact", head: true })
    .eq("course_placement_id", id);

  if (count && count > 0) {
    return {
      success: false,
      error: `Cannot delete: ${count} student(s) are assigned to this course. Deactivate it instead.`,
    };
  }

  // Check if any sessions use this course
  const { count: sessionCount } = await supabase
    .from("sessions")
    .select("id", { count: "exact", head: true })
    .eq("course_placement_id", id);

  if (sessionCount && sessionCount > 0) {
    return {
      success: false,
      error: `Cannot delete: ${sessionCount} session(s) use this course. Deactivate it instead.`,
    };
  }

  const { error } = await supabase.from("course_placement").delete().eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/settings/admin");
  return { success: true };
}

// ============ ASSESSMENTS ============

export async function getAssessments() {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("assessments")
    .select("id, name, active, course_id, created_at")
    .order("name");

  if (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to fetch assessments:", error.message);
    return [];
  }
  return data ?? [];
}

export async function createAssessment(name: string, courseId: string | null): Promise<ActionResult<{ id: string }>> {
  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("assessments")
    .insert({ name, active: true, course_id: courseId })
    .select("id")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/settings/admin");
  return { success: true, data: { id: data.id } };
}

export async function updateAssessment(
  id: string,
  updates: { name?: string; active?: boolean; course_id?: string | null },
): Promise<ActionResult> {
  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("assessments").update(updates).eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/settings/admin");
  return { success: true };
}

export async function deleteAssessment(id: string): Promise<ActionResult> {
  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = createServerSupabaseClient();

  // Check if any assessment results exist
  const { count } = await supabase
    .from("assessment_results")
    .select("id", { count: "exact", head: true })
    .eq("assessment_id", id);

  if (count && count > 0) {
    return {
      success: false,
      error: `Cannot delete: ${count} result(s) exist for this assessment. Deactivate it instead.`,
    };
  }

  const { error } = await supabase.from("assessments").delete().eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/settings/admin");
  return { success: true };
}
