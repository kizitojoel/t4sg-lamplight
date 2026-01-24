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

  if (sessionError || !session) {
    redirect("/dashboard/sessions");
  }

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
      <SessionDetail session={session} enrollments={enrollments ?? []} />
    </div>
  );
}
