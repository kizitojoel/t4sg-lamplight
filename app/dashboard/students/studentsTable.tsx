"use client";

import { Table } from "@radix-ui/themes";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useEffect, useState } from "react";
import StudentModal from "../student-modal/student-modal";
import StudentImportButton from "./components/StudentImportButton";

interface Student {
  id: string;
  legal_first_name: string;
  legal_last_name: string;
  preferred_name: string | null;
  program: string;
  email: string | null;
  phone: string | null;
  course_placement: string;
}

export default function StudentsTable({
  students,
  programs,
  courses,
}: {
  students: Student[];
  programs: { id: string; name: string }[];
  courses: { id: string; name: string }[];
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [programFilter, setProgramFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  // Checkbox
  const handleCheckboxChange = (studentId: string) => {
    setSelectedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  };

  // Select all checkbox
  const handleSelectAll = () => {
    const allFilteredIds = new Set(sortedStudents.map((student) => student.id));
    const allFilteredSelected = sortedStudents.every((student) => selectedRows.has(student.id));

    setSelectedRows((_prev) => {
      if (allFilteredSelected) {
        // Deselect all filtered students
        return new Set();
      } else {
        // Select all filtered students
        return allFilteredIds;
      }
    });
  };

  // Filter students based on search and filters
  const filteredStudents = students.filter((student) => {
    // Search filter (name, email, phone)
    const fullName = `${student.preferred_name ?? student.legal_first_name} ${student.legal_last_name}`.toLowerCase();
    const email = (student.email ?? "").toLowerCase();
    const matchesSearch =
      searchTerm === "" || fullName.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase());

    // Program filter
    const matchesProgram = programFilter === "all" || student.program === programFilter;

    // Course filter
    const matchesCourse = courseFilter === "all" || student.course_placement === courseFilter;

    return matchesSearch && matchesProgram && matchesCourse;
  });

  // Sort students by name
  const sortedStudents = [...filteredStudents].sort((a, b) => {
    const nameA = `${a.preferred_name ?? a.legal_first_name} ${a.legal_last_name}`.toLowerCase();
    const nameB = `${b.preferred_name ?? b.legal_first_name} ${b.legal_last_name}`.toLowerCase();

    if (sortOrder === "asc") {
      return nameA.localeCompare(nameB);
    } else {
      return nameB.localeCompare(nameA);
    }
  });

  // Toggle sort order
  const toggleSort = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const totalPages = Math.ceil(sortedStudents.length / rowsPerPage);
  const paginatedStudents = sortedStudents.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const [mounted, setMounted] = useState(false);
  useTheme();

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="px-2.5 py-10">
      {/* Header Controls */}
      <div className="mb-8 flex items-center gap-4">
        {/* Search Bar */}
        <input
          type="text"
          placeholder="Search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border-accent bg-accent h-10 w-1/4 border p-2.5"
        />

        {/* All Programs Dropdown */}
        <select
          value={programFilter}
          onChange={(e) => setProgramFilter(e.target.value)}
          className="bg-accent h-10 cursor-pointer px-4 text-center"
        >
          <option value="all">All Programs</option>
          {programs.map((program) => (
            <option key={program.id} value={program.name}>
              {program.name}
            </option>
          ))}
        </select>

        {/* All Sessions Dropdown */}
        <select className="bg-accent h-10 cursor-pointer px-4 text-center">
          <option>All Sessions</option>
        </select>

        {/* Course Dropdown */}
        <select
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
          className="bg-accent h-10 cursor-pointer px-4 text-center"
        >
          <option value="all">All Courses</option>
          {courses.map((course) => (
            <option key={course.id} value={course.name}>
              {course.name}
            </option>
          ))}
        </select>

        {/* Spacer */}
        <div className="flex-1"></div>

        {/* Export CSV Button */}
        <button className="bg-accent cursor-pointer rounded-2xl px-4 py-2.5">Export CSV</button>

        {/* Add Student Button */}
        <Link href="/dashboard/newstudent">
          <button className="bg-accent cursor-pointer rounded-2xl px-4 py-2.5">Add Student</button>
        </Link>
      </div>

      {/* Radix Table */}
      <Table.Root variant="surface" className="{`border ${theme}`} border-gray-50">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell className="w-[60px] border-r text-center" style={{ padding: "8px 8px" }}>
              <input
                type="checkbox"
                checked={sortedStudents.length > 0 && sortedStudents.every((student) => selectedRows.has(student.id))}
                onChange={handleSelectAll}
                style={{ width: "18px", height: "18px" }}
              />
            </Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell
              onClick={toggleSort}
              className="border-r"
              style={{
                textAlign: "center",
                padding: "8px 8px",
                cursor: "pointer",
                userSelect: "none",
              }}
            >
              Name {sortOrder === "asc" ? "▲" : "▼"}
            </Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell className="border-r" style={{ textAlign: "center", padding: "8px 8px" }}>
              Email
            </Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell className="border-r" style={{ textAlign: "center", padding: "8px 8px" }}>
              Phone
            </Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell className="border-r" style={{ textAlign: "center", padding: "8px 8px" }}>
              Program
            </Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell className="border-r" style={{ textAlign: "center", padding: "8px 8px" }}>
              Session
            </Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell className="border-r" style={{ textAlign: "center", padding: "8px 8px" }}>
              Current Course
            </Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell style={{ textAlign: "center", padding: "8px 8px" }}>
              View More
            </Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {paginatedStudents.map((student) => (
            <Table.Row key={student.id} className={selectedRows.has(student.id) ? "bg-blue-100 dark:bg-blue-900" : ""}>
              <Table.Cell className="border-r text-center" style={{ padding: "8px 8px" }}>
                <input
                  type="checkbox"
                  checked={selectedRows.has(student.id)}
                  onChange={() => handleCheckboxChange(student.id)}
                  style={{ width: "18px", height: "18px", alignContent: "center" }}
                />
              </Table.Cell>
              <Table.Cell className="border-r" style={{ padding: "8px 8px" }}>
                {student.preferred_name ?? student.legal_first_name} {student.legal_last_name.charAt(0)}
              </Table.Cell>
              <Table.Cell className="border-r" style={{ padding: "8px 8px" }}>
                {student.email}
              </Table.Cell>
              <Table.Cell className="border-r" style={{ padding: "8px 8px" }}>
                {student.phone}
              </Table.Cell>
              <Table.Cell className="border-r" style={{ padding: "8px 8px" }}>
                {student.program}
              </Table.Cell>
              <Table.Cell className="border-r" style={{ padding: "8px 8px" }}>
                {/* Session - to be added later*/}
              </Table.Cell>
              <Table.Cell className="border-r" style={{ padding: "8px 8px" }}>
                {student.course_placement}
              </Table.Cell>
              <Table.Cell className="border-r" style={{ textAlign: "center", fontSize: "20px", fontWeight: "bold" }}>
                <StudentModal studentId={student.id}></StudentModal>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>

      {/* Pagination Controls */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: "20px", gap: "10px" }}>
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="bg-accent cursor-pointer rounded-2xl px-4 py-2"
        >
          Prev
        </button>
        <span className="my-auto">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="bg-accent cursor-pointer rounded-2xl px-4 py-2"
        >
          Next
        </button>
      </div>

      {/* Results count */}
      <div style={{ marginTop: "16px", color: "#666", fontSize: "14px" }}>
        Showing {sortedStudents.length} of {students.length} students
      </div>

      {/* Import from Google Sheets button at bottom */}
      <div className="mt-10">
        <StudentImportButton />
      </div>
    </div>
  );
}
