"use server";

import { createServerSupabaseClient } from "@/lib/server-utils";
import { revalidatePath } from "next/cache";

// Types
export interface CreateSessionInput {
  course_placement_id: string;
  quarter: "Winter" | "Spring" | "Summer" | "Fall";
  year: number;
  status?: "upcoming" | "active" | "completed";
}

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Create a new session
 */
export async function createSession(input: CreateSessionInput): Promise<ActionResult<{ id: number }>> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("sessions")
    .insert({
      course_placement_id: input.course_placement_id,
      quarter: input.quarter,
      year: input.year,
      status: input.status ?? "active",
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "A session for this course, quarter, and year already exists." };
    }
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/sessions");
  return { success: true, data: { id: data.id } };
}

/**
 * Update session status (e.g., mark as completed)
 */
export async function updateSessionStatus(
  sessionId: number,
  status: "upcoming" | "active" | "completed",
): Promise<ActionResult> {
  const supabase = createServerSupabaseClient();

  const { error } = await supabase.from("sessions").update({ status }).eq("id", sessionId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/sessions");
  revalidatePath(`/dashboard/sessions/${sessionId}`);
  return { success: true };
}

/**
 * Add a student to a session.
 * This will:
 * 1. Mark any existing current enrollments as completed
 * 2. Create a new enrollment for the student in this session
 * 3. Update the student's course_placement_id
 */
export async function addStudentToSession(studentId: string, sessionId: number): Promise<ActionResult> {
  const supabase = createServerSupabaseClient();

  // Get the session to find the course_placement_id
  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select("course_placement_id")
    .eq("id", sessionId)
    .single();

  if (sessionError || !session) {
    return { success: false, error: "Session not found" };
  }

  // Check if student already enrolled in this session
  const { data: existingEnrollment } = await supabase
    .from("enrollments")
    .select("id")
    .eq("student_id", studentId)
    .eq("session_id", sessionId)
    .single();

  if (existingEnrollment) {
    return { success: false, error: "Student is already enrolled in this session" };
  }

  // Start transaction-like operations
  // 1. Mark existing current enrollments as completed
  const { error: updateError } = await supabase
    .from("enrollments")
    .update({ is_current: false, status: "completed", ended_at: new Date().toISOString() })
    .eq("student_id", studentId)
    .eq("is_current", true);

  if (updateError) {
    return { success: false, error: `Failed to update existing enrollments: ${updateError.message}` };
  }

  // 2. Create new enrollment
  const { error: insertError } = await supabase.from("enrollments").insert({
    student_id: studentId,
    session_id: sessionId,
    is_current: true,
    status: "enrolled",
  });

  if (insertError) {
    return { success: false, error: `Failed to create enrollment: ${insertError.message}` };
  }

  // 3. Update student's course_placement_id
  const { error: studentUpdateError } = await supabase
    .from("students")
    .update({ course_placement_id: session.course_placement_id })
    .eq("id", studentId);

  if (studentUpdateError) {
    return { success: false, error: `Failed to update student: ${studentUpdateError.message}` };
  }

  revalidatePath("/dashboard/sessions");
  revalidatePath(`/dashboard/sessions/${sessionId}`);
  revalidatePath("/dashboard/students");
  return { success: true };
}

/**
 * Remove a student from a session (mark enrollment as dropped)
 */
export async function removeStudentFromSession(studentId: string, sessionId: number): Promise<ActionResult> {
  const supabase = createServerSupabaseClient();

  const { error } = await supabase
    .from("enrollments")
    .update({ is_current: false, status: "dropped", ended_at: new Date().toISOString() })
    .eq("student_id", studentId)
    .eq("session_id", sessionId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/sessions");
  revalidatePath(`/dashboard/sessions/${sessionId}`);
  return { success: true };
}

/**
 * Get students enrolled in a session
 */
export async function getSessionStudents(sessionId: number) {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("enrollments")
    .select(
      `
      id,
      is_current,
      status,
      enrolled_at,
      student:student_id (
        id,
        student_code,
        legal_first_name,
        legal_last_name,
        preferred_name,
        email
      )
    `,
    )
    .eq("session_id", sessionId)
    .order("enrolled_at", { ascending: false });

  if (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to fetch session students:", error.message);
    return [];
  }

  return data ?? [];
}

/**
 * Search students not in a specific session
 */
export async function searchStudentsNotInSession(sessionId: number, query: string) {
  const supabase = createServerSupabaseClient();

  // Get students already in this session
  const { data: enrolledStudents } = await supabase
    .from("enrollments")
    .select("student_id")
    .eq("session_id", sessionId);

  const enrolledIds = (enrolledStudents ?? []).map((e) => e.student_id);

  // Search students not in this session
  let studentsQuery = supabase
    .from("students")
    .select("id, student_code, legal_first_name, legal_last_name, preferred_name, email")
    .order("legal_last_name")
    .limit(20);

  // Exclude already enrolled students
  if (enrolledIds.length > 0) {
    studentsQuery = studentsQuery.not("id", "in", `(${enrolledIds.join(",")})`);
  }

  // Apply search filter
  if (query) {
    studentsQuery = studentsQuery.or(
      `legal_first_name.ilike.%${query}%,legal_last_name.ilike.%${query}%,email.ilike.%${query}%,student_code.ilike.%${query}%`,
    );
  }

  const { data, error } = await studentsQuery;

  if (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to search students:", error.message);
    return [];
  }

  return data ?? [];
}
