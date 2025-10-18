import { createServerSupabaseClient } from "@/lib/server-utils";
import { redirect } from "next/navigation";

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
      address_street,
      address_city,
      address_state,
      address_zip,
      course_placement
    `,
    )
    .order("legal_last_name", { ascending: true });

  if (error) {
    return <div>Error loading students: {error.message}</div>;
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1 style={{ fontSize: "24px", fontWeight: "600", marginBottom: "24px" }}>Student Roster</h1>

      {/* Header Controls */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "24px",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        {/* Search Bar */}
        <input
          type="text"
          placeholder="Search"
          style={{
            flex: "1",
            minWidth: "250px",
            padding: "8px 12px",
            border: "1px solid #ccc",
            borderRadius: "4px",
          }}
        />

        {/* All Programs Dropdown */}
        <select
          style={{
            padding: "8px 12px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            backgroundColor: "#f5f5f5",
          }}
        >
          <option>All Programs</option>
        </select>

        {/* All Sessions Dropdown */}
        <select
          style={{
            padding: "8px 12px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            backgroundColor: "#f5f5f5",
          }}
        >
          <option>All Sessions</option>
        </select>

        {/* All Courses Dropdown */}
        <select
          style={{
            padding: "8px 12px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            backgroundColor: "#f5f5f5",
          }}
        >
          <option>All Courses</option>
        </select>

        {/* Spacer */}
        <div style={{ flex: "1" }}></div>

        {/* Export CSV Button */}
        <button
          style={{
            padding: "8px 16px",
            backgroundColor: "#f5f5f5",
            border: "1px solid #ccc",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "500",
          }}
        >
          Export CSV
        </button>

        {/* Add Student Button */}
        <button
          style={{
            padding: "8px 16px",
            backgroundColor: "#f5f5f5",
            border: "1px solid #ccc",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "500",
          }}
        >
          Add Student
        </button>
      </div>

      {/* Placeholder for table */}
      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: "4px",
          padding: "20px",
          backgroundColor: "#f9f9f9",
        }}
      >
        <p>Student table will be implemented here</p>
        <p style={{ fontSize: "14px", color: "#666", marginTop: "8px" }}>
          {students?.length ?? 0} students loaded from database
        </p>
      </div>
    </div>
  );
}
