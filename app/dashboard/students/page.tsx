import { getAllLookupData } from "@/lib/lookup-data";
import { createServerSupabaseClient, getAuthenticatedUser } from "@/lib/server-utils";
import { redirect } from "next/navigation";
import StudentImportButton from "./components/StudentImportButton";
import StudentsTable from "./studentsTable";

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; program?: string; course?: string }>;
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
  const ITEMS_PER_PAGE = 20;
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  const supabase = createServerSupabaseClient();

  // Use Supabase joins to fetch related data in a single query
  // This is more performant than separate queries or client-side lookups
  let studentsQuery = supabase
    .from("students")
    .select(
      `
      id,
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
      { count: "exact" },
    )
    .order("legal_last_name", { ascending: true })
    .range(offset, offset + ITEMS_PER_PAGE - 1);

  // Apply filters using IDs (more efficient than enum filtering)
  if (query) {
    studentsQuery = studentsQuery.or(
      `legal_first_name.ilike.%${query}%,legal_last_name.ilike.%${query}%,email.ilike.%${query}%`,
    );
  }

  if (programFilter !== "all") {
    studentsQuery = studentsQuery.eq("program_id", programFilter);
  }

  if (courseFilter !== "all") {
    studentsQuery = studentsQuery.eq("course_placement_id", courseFilter);
  }

  // Fetch students and lookup data in parallel
  // getAllLookupData is cached, so it won't duplicate queries if called elsewhere
  const [studentsResult, lookupData] = await Promise.all([studentsQuery, getAllLookupData()]);

  const { data: students, error: studentsError, count } = studentsResult;
  const { programs, coursePlacements: courses } = lookupData;

  if (studentsError) {
    return <div>Error loading students: {studentsError.message}</div>;
  }

  const totalPages = count ? Math.ceil(count / ITEMS_PER_PAGE) : 0;

  return (
    <div>
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
        }}
      />
      {/* Import from Google Sheets button at bottom */}
      <div className="mt-10">
        <StudentImportButton programs={programs} coursePlacements={courses} />
      </div>
    </div>
  );
}
