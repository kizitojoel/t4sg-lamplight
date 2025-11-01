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

  // Fetch students
  const { data: students, error: studentsError } = await supabase
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

  if (studentsError) {
    return <div>Error loading students: {studentsError.message}</div>;
  }

  // Fetch all available course placements from separate table
  const { data: courses, error: coursesError } = await supabase.from("course_placement").select("name"); // change "name" if your column is named differently

  if (coursesError) {
    return <div>Error loading courses: {coursesError.message}</div>;
  }

  return <StudentsTable students={students ?? []} courses={courses ?? []} />;
}
