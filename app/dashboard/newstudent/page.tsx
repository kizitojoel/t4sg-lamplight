import { createServerSupabaseClient, getAuthenticatedUser } from "@/lib/server-utils";
import { redirect } from "next/navigation";
import AddStudentForm from "./AddStudentForm";

export default async function NewStudentPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/");
  }

  const supabase = createServerSupabaseClient();

  // Fetch lookup data in parallel
  const [programsResult, coursesResult] = await Promise.all([
    supabase.from("program").select("id, name").order("name"),
    supabase.from("course_placement").select("id, name").order("name"),
  ]);

  const programs = programsResult.data ?? [];
  const courses = coursesResult.data ?? [];

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-96">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Student</h1>
      </div>
      <AddStudentForm programs={programs} courses={courses} />
    </div>
  );
}
