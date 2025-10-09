import { createServerSupabaseClient } from "@/lib/server-utils";
import { redirect } from "next/navigation";
//Front end component
//import "insert Frontend" from "@/components/<"Frontend-name-here">";

export default async function StudentsPage() {
  console.log("student page loaded");
  const supabase = createServerSupabaseClient();

  // auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.log("user authenticated:", user?.email || "No user found");
  console.log("User authenticated:", user?.email);

  if (!user) {
    redirect("/");
  }

  console.log("user authenticated, fetching students");

  // fetch student data
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
      address_street,
      address_city,
      address_state,
      address_zip,
      course_placement
    `,
    )
    .order("legal_last_name", { ascending: true });

  if (error) {
    console.error("Error fetching students:", error);
    return <div>Error loading students: {error.message}</div>;
  }

  console.log("Students fetched successfully");
  console.log("Total students:", students?.length || 0);
  console.log("First student:", students?.[0]);
  console.log("All student data:", students);
  console.log("END OF STUDENTS PAGE\n");

  // Pass data to frontend component
  //return <"insert-frontend-comp-name" students={students || []} />;
  return (
    <div style={{ padding: "20px" }}>
      <h1>Students Page</h1>
      <p>Data fetched successfully!</p>
      <p>Total students: {students?.length || 0}</p>
    </div>
  );
}
