// app/dashboard/students/page.tsx
import { createServerSupabaseClient } from "@/lib/server-utils";
import { Table } from "@radix-ui/themes";
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
      course_placement
    `,
    )
    .order("legal_last_name", { ascending: true });

  if (error) {
    return <div>Error loading students: {error.message}</div>;
  }

  return (
    <div style={{ padding: "10px 40px", backgroundColor: "#ffffff" }}>
      {/* Header Controls */}
      <div
        style={{
          display: "flex",
          gap: "16px",
          marginBottom: "32px",
          alignItems: "center",
        }}
      >
        {/* Search Bar */}
        <input
          type="text"
          placeholder="Search"
          style={{
            width: "364px",
            height: "38px",
            padding: "10px",
            border: "1px solid #000",
            backgroundColor: "#F6F6F6",
            fontSize: "15px",
            fontWeight: "400",
          }}
        />

        {/* All Programs Dropdown */}
        <select
          style={{
            width: "134px",
            height: "38px",
            paddingLeft: "10px",
            paddingRight: "10px",
            border: "none",
            backgroundColor: "#E9E9E9",
            cursor: "pointer",
            fontSize: "15px",
            textAlign: "center",
          }}
        >
          <option>All Programs</option>
        </select>

        {/* All Sessions Dropdown */}
        <select
          style={{
            width: "134px",
            height: "38px",
            paddingLeft: "10px",
            paddingRight: "10px",
            border: "none",
            backgroundColor: "#E9E9E9",
            cursor: "pointer",
            fontSize: "15px",
            textAlign: "center",
          }}
        >
          <option>All Sessions</option>
        </select>

        {/* All Courses Dropdown */}
        <select
          style={{
            width: "134px",
            height: "38px",
            paddingLeft: "10px",
            paddingRight: "10px",
            border: "none",
            backgroundColor: "#E9E9E9",
            cursor: "pointer",
            fontSize: "15px",
            textAlign: "center",
          }}
        >
          <option>All Courses</option>
        </select>

        {/* Spacer */}
        <div style={{ flex: "1" }}></div>

        {/* Export CSV Button */}
        <button
          style={{
            padding: "10px 24px",
            backgroundColor: "#C5C5C5",
            border: "none",
            borderRadius: "16px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "400",
          }}
        >
          Export CSV
        </button>

        {/* Add Student Button */}
        <button
          style={{
            padding: "10px 24px",
            backgroundColor: "#C5C5C5",
            border: "none",
            borderRadius: "20px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "400",
          }}
        >
          Add Student
        </button>
      </div>

      {/* Radix Table */}
      <Table.Root variant="surface" style={{ border: "1px solid #ccc" }}>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell
              style={{ width: "60px", textAlign: "center", padding: "8px 8px", borderRight: "1px solid #e5e5e5" }}
            ></Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell
              style={{ textAlign: "center", padding: "8px 8px", borderRight: "1px solid #e5e5e5" }}
            >
              Name
            </Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell
              style={{ textAlign: "center", padding: "8px 8px", borderRight: "1px solid #e5e5e5" }}
            >
              Email
            </Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell
              style={{ textAlign: "center", padding: "8px 8px", borderRight: "1px solid #e5e5e5" }}
            >
              Phone
            </Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell
              style={{ textAlign: "center", padding: "8px 8px", borderRight: "1px solid #e5e5e5" }}
            >
              Program
            </Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell
              style={{ textAlign: "center", padding: "8px 8px", borderRight: "1px solid #e5e5e5" }}
            >
              Session
            </Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell
              style={{ textAlign: "center", padding: "8px 8px", borderRight: "1px solid #e5e5e5" }}
            >
              Current Course
            </Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell style={{ textAlign: "center", padding: "8px 8px" }}>
              View More
            </Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {students?.map((student) => (
            <Table.Row key={student.id}>
              <Table.Cell style={{ textAlign: "center", padding: "8px 8px", borderRight: "1px solid #e5e5e5" }}>
                <input type="checkbox" style={{ width: "18px", height: "18px", alignContent: "center" }} />
              </Table.Cell>
              <Table.Cell style={{ padding: "8px 8px", borderRight: "1px solid #e5e5e5" }}>
                {student.preferred_name ?? student.legal_first_name} {student.legal_last_name.charAt(0)}
              </Table.Cell>
              <Table.Cell style={{ padding: "8px 8px", borderRight: "1px solid #e5e5e5" }}>{student.email}</Table.Cell>
              <Table.Cell style={{ padding: "8px 8px", borderRight: "1px solid #e5e5e5" }}>{student.phone}</Table.Cell>
              <Table.Cell style={{ padding: "8px 8px", borderRight: "1px solid #e5e5e5" }}>
                {student.program}
              </Table.Cell>
              <Table.Cell style={{ padding: "8px 8px", borderRight: "1px solid #e5e5e5" }}>
                {/* Session - to be added */}
              </Table.Cell>
              <Table.Cell style={{ padding: "8px 8px", borderRight: "1px solid #e5e5e5" }}>
                {student.course_placement}
              </Table.Cell>
              <Table.Cell style={{ textAlign: "center", fontSize: "20px", fontWeight: "bold" }}>+</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>

      {/* Import from Google Sheets button at bottom */}
      <div style={{ marginTop: "40px" }}>
        <button
          style={{
            padding: "12px 24px",
            backgroundColor: "#d9d9d9",
            border: "none",
            borderRadius: "20px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "500",
          }}
        >
          Import from Google Sheets
        </button>
      </div>
    </div>
  );
}
