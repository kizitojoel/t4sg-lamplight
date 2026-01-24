import { createServerSupabaseClient, getAuthenticatedUser } from "@/lib/server-utils";
import { redirect } from "next/navigation";
import SessionDetail from "./sessionDetail";

export default async function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/");
  }

  const { id } = await params;
  const sessionId = parseInt(id);

  if (isNaN(sessionId)) {
    redirect("/dashboard/sessions");
  }

  const supabase = createServerSupabaseClient();

  // Fetch session details
  const { data: session, error: sessionError } = await supabase
    .from("sessions_with_details")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (sessionError || session?.id == null) {
    redirect("/dashboard/sessions");
  }

  // Transform session to ensure non-null values (we already checked above)
  const sessionData = {
    id: session.id,
    course_name: session.course_name ?? "",
    quarter: session.quarter ?? "",
    year: session.year ?? 0,
    status: session.status ?? "active",
    display_name: session.display_name ?? "",
    enrolled_count: session.enrolled_count ?? 0,
  };

  // Fetch enrolled students
  const { data: enrollments } = await supabase
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

  return (
    <div className="px-2.5 py-10">
      <SessionDetail session={sessionData} enrollments={enrollments ?? []} />
    </div>
  );
}
