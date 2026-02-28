import { getActiveSessionsForFilter, getAllLookupData } from "@/lib/lookup-data";
import { createServerSupabaseClient, getAuthenticatedUser } from "@/lib/server-utils";
import { redirect } from "next/navigation";
import StudentImportButton from "./components/StudentImportButton";
import StudentsTable from "./studentsTable";

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; program?: string; course?: string; session?: string }>;
}) {
  // Use cached function to get user efficiently
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/");
  }

  const params = await searchParams;
  // Use || for currentPage since Number() returns NaN (not null/undefined) for invalid values
  const currentPage = Number(params.page) || 1;
  const query = params.q ?? "";
  const programFilter = params.program ?? "all"; // This is now program_id
  const courseFilter = params.course ?? "all"; // This is now course_placement_id
  const sessionFilter = params.session ?? "";
  const ITEMS_PER_PAGE = 20;
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  const supabase = createServerSupabaseClient();

  // If filtering by session, get student IDs from enrollments first
  let sessionStudentIds: string[] | null = null;
  let sessionInfo: { display_name: string } | null = null;

  if (sessionFilter) {
    const sessionId = parseInt(sessionFilter);
    if (!isNaN(sessionId)) {
      const [sessionRes, enrollmentsRes] = await Promise.all([
        supabase
          .from("sessions")
          .select("id, quarter, year, course_placement:course_placement_id(name)")
          .eq("id", sessionId)
          .single(),
        supabase
          .from("enrollments")
          .select("student_id")
          .eq("session_id", sessionId)
          .eq("is_current", true)
          .eq("status", "enrolled"),
      ]);
      const sessionRow = sessionRes.data as {
        id: number;
        quarter: string;
        year: number;
        course_placement: { name: string } | null;
      } | null;
      if (sessionRow) {
        const name = sessionRow.course_placement?.name ?? "";
        sessionInfo = {
          display_name: name
            ? `${name} - ${sessionRow.quarter} ${sessionRow.year}`
            : `${sessionRow.quarter} ${sessionRow.year}`,
        };
      }
      sessionStudentIds = (enrollmentsRes.data ?? []).map((e) => e.student_id);
    }
  }

  // Use Supabase joins to fetch related data in a single query
  // This is more performant than separate queries or client-side lookups
  let studentsQuery = supabase
    .from("students")
    .select(
      `
      id,
      student_code,
      legal_first_name,
      legal_last_name,
      preferred_name,
      email,
      phone,
      program_id,
      course_placement_id,
      program:program_id(id, name),
      course_placement:course_placement_id(id, name)
    `,
      { count: "planned" },
    )
    .order("legal_last_name", { ascending: true })
    .range(offset, offset + ITEMS_PER_PAGE - 1);

  // Apply session filter by student IDs
  if (sessionStudentIds !== null) {
    if (sessionStudentIds.length === 0) {
      // No students in session, return empty result
      studentsQuery = studentsQuery.in("id", ["00000000-0000-0000-0000-000000000000"]);
    } else {
      studentsQuery = studentsQuery.in("id", sessionStudentIds);
    }
  }

  // Apply filters using IDs (more efficient than enum filtering)
  // Search by name, email, or student_code
  if (query) {
    studentsQuery = studentsQuery.or(
      `legal_first_name.ilike.%${query}%,legal_last_name.ilike.%${query}%,email.ilike.%${query}%,student_code.ilike.%${query}%`,
    );
  }

  if (programFilter !== "all") {
    studentsQuery = studentsQuery.eq("program_id", programFilter);
  }

  if (courseFilter !== "all") {
    studentsQuery = studentsQuery.eq("course_placement_id", courseFilter);
  }

  // Fetch students, lookup data, and active sessions (lightweight) in parallel
  const [studentsResult, lookupData, sessions] = await Promise.all([
    studentsQuery,
    getAllLookupData(),
    getActiveSessionsForFilter(),
  ]);

  const { data: students, error: studentsError, count } = studentsResult;
  const { programs, coursePlacements: courses } = lookupData;

  if (studentsError) {
    return <div>Error loading students: {studentsError.message}</div>;
  }

  const totalPages = count ? Math.ceil(count / ITEMS_PER_PAGE) : 0;

  return (
    <div>
      {/* Session filter banner */}
      {sessionInfo && (
        <div className="mb-4 flex items-center justify-between rounded-lg bg-blue-50 px-4 py-3 dark:bg-blue-900/20">
          <span className="text-sm">
            Showing students enrolled in: <strong>{sessionInfo.display_name}</strong>
          </span>
          <a href="/dashboard/students" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
            Clear filter
          </a>
        </div>
      )}
      <StudentsTable
        students={students ?? []}
        programs={programs ?? []}
        courses={courses ?? []}
        pagination={{
          currentPage,
          totalPages,
          totalCount: count ?? 0,
        }}
        initialFilters={{
          query,
          program: programFilter,
          course: courseFilter,
          session: sessionFilter,
        }}
        sessions={sessions}
      />
      {/* Import from Google Sheets button at bottom */}
      <div className="mt-10">
        <StudentImportButton programs={programs} coursePlacements={courses} />
      </div>
    </div>
  );
}
