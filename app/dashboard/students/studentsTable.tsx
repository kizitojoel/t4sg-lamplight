"use client";

import { Table } from "@radix-ui/themes";
import { useState } from "react";
import StudentModal from "../student-modal/student-modal";

type Student = {
  id: string;
  legal_first_name: string;
  legal_last_name: string;
  preferred_name: string | null;
  program: string;
  email: string | null;
  phone: string | null;
  course_placement: string;
};

export default function StudentsTable({ students }: { students: Student[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [programFilter, setProgramFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("all");

  // Filter students based on search and filters
  const filteredStudents = students.filter((student) => {
    // Search filter (name, email, phone)
    const fullName = `${student.preferred_name ?? student.legal_first_name} ${student.legal_last_name}`.toLowerCase();
    const email = (student.email ?? "").toLowerCase();
    const phone = (student.phone ?? "").toLowerCase();
    const matchesSearch =
      searchTerm === "" ||
      fullName.includes(searchTerm.toLowerCase()) ||
      email.includes(searchTerm.toLowerCase()) ||
      phone.includes(searchTerm.toLowerCase());

    // Program filter
    const matchesProgram = programFilter === "all" || student.program === programFilter;

    // Course filter
    const matchesCourse = courseFilter === "all" || student.course_placement === courseFilter;

    return matchesSearch && matchesProgram && matchesCourse;
  });

  // Get unique courses for the dropdown
  const uniqueCourses = Array.from(new Set(students.map((s) => s.course_placement)));

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
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
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
          value={programFilter}
          onChange={(e) => setProgramFilter(e.target.value)}
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
          <option value="all">All Programs</option>
          <option value="ESOL">ESOL</option>
          <option value="HCP">HCP</option>
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
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
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
          <option value="all">All Courses</option>
          {uniqueCourses.map((course) => (
            <option key={course} value={course}>
              {course}
            </option>
          ))}
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
          {filteredStudents.map((student) => (
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
              <Table.Cell style={{ textAlign: "center", fontSize: "20px", fontWeight: "bold" }}>
                <StudentModal studentId={student.id}></StudentModal>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>

      {/* Results count */}
      <div style={{ marginTop: "16px", color: "#666", fontSize: "14px" }}>
        Showing {filteredStudents.length} of {students.length} students
      </div>

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
