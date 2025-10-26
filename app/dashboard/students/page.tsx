import { createServerSupabaseClient } from "@/lib/server-utils";
import { redirect } from "next/navigation";
import StudentsTable from "./studentsTable";

export default async function StudentsPage() {
  const supabase = createServerSupabaseClient();

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  // Fetch student data
  const { data: students, error } = await supabase
    .from("students")
    .select(
      `
      id,
      legal_first_name,
      legal_last_name,
      preferred_name,
      program,
      email,
      phone,
      course_placement
    `,
    )
    .order("legal_last_name", { ascending: true });

  if (error) {
    return <div>Error loading students: {error.message}</div>;
  }

  return <StudentsTable students={students ?? []} />;
}
