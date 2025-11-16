import { createServerSupabaseClient } from "@/lib/server-utils";
import { redirect } from "next/navigation";
import StudentImportButton from "./components/StudentImportButton";
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

  // Fetch programs
  const { data: programs, error: programsError } = await supabase.from("program").select("id, name");
  if (programsError) {
    return <div>Error loading programs: {programsError.message}</div>;
  }

  // Fetch course placements
  const { data: courses, error: coursesError } = await supabase.from("course_placement").select("id, name");

  if (coursesError) {
    return <div>Error loading courses: {coursesError.message}</div>;
  }

  return (
    <div>
      <StudentsTable students={students ?? []} programs={programs ?? []} courses={courses ?? []} />
      {/* Import from Google Sheets button at bottom */}
      <div className="mt-10">
        <StudentImportButton />
      </div>
    </div>
  );
}
