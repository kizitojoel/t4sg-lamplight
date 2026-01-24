"use client";

import { Table } from "@radix-ui/themes";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import StudentModal from "../student-modal/student-modal";

interface Student {
  id: string;
  student_code: string | null;
  legal_first_name: string;
  legal_last_name: string;
  preferred_name: string | null;
  email: string | null;
  phone: string | null;
  program_id: string | null;
  course_placement_id: string | null;
  // Joined data from lookup tables
  program: { id: string; name: string } | null;
  course_placement: { id: string; name: string } | null;
}

export default function StudentsTable({
  students,
  programs,
  courses,
  pagination,
  initialFilters,
}: {
  students: Student[];
  programs: { id: string; name: string }[];
  courses: { id: string; name: string }[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
  };
  initialFilters: {
    query: string;
    program: string;
    course: string;
  };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Local state for immediate UI feedback
  const [searchTerm, setSearchTerm] = useState(initialFilters.query);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Sync local state with props when they change (e.g. back button)
  useEffect(() => {
    setSearchTerm(initialFilters.query);
  }, [initialFilters.query]);

  const updateUrl = useCallback(
    (updates: Record<string, string | number | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === "" || value === "all") {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });
      startTransition(() => {
        router.push(`?${params.toString()}`);
      });
    },
    [searchParams, router],
  );

  // Debounce search update
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== initialFilters.query) {
        updateUrl({ q: searchTerm, page: 1 });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, initialFilters.query, updateUrl]);

  const handleProgramChange = (value: string) => {
    updateUrl({ program: value, page: 1 });
  };

  const handleCourseChange = (value: string) => {
    updateUrl({ course: value, page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    updateUrl({ page: newPage });
  };

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

  // Select all checkbox (current page only)
  const handleSelectAll = () => {
    const allOnPage = students.every((student) => selectedRows.has(student.id));

    setSelectedRows((prev) => {
      const newSet = new Set(prev);
      students.forEach((student) => {
        if (allOnPage) {
          newSet.delete(student.id);
        } else {
          newSet.add(student.id);
        }
      });
      return newSet;
    });
  };

  // Export CSV (Exports selected rows or ALL if none selected - logic adjusted for pagination)
  // Note: For pagination, "Export All" might need to fetch all from server. 
  // For now, we keep existing logic which fetches by ID for selected rows.
  // If no rows selected, we might want to alert user to select rows or implement "Export All Matches"
  const handleExportCSV = async () => {
    if (selectedRows.size === 0) {
      alert("Please select students to export");
      return;
    }

    try {
      const { createBrowserSupabaseClient } = await import("@/lib/client-utils");
      const supabase = createBrowserSupabaseClient();

      const { data: fullStudentData, error } = await supabase
        .from("students")
        .select("*")
        .in("id", Array.from(selectedRows));

      if (error) {
        alert("Failed to export students. Please try again.");
        return;
      }

      if (!fullStudentData || fullStudentData.length === 0) {
        alert("No student data found to export");
        return;
      }

      const firstStudent = fullStudentData[0];
      if (!firstStudent) return;

      const headers = Object.keys(firstStudent).filter((key) => key !== "id");

      const rows = fullStudentData.map((student) =>
        headers.map((header) => {
          const value = student[header as keyof typeof student];
          if (Array.isArray(value)) {
            return value
              .map((item) => {
                if (typeof item === "string") return item;
                if (typeof item === "number" || typeof item === "boolean") return String(item);
                return JSON.stringify(item);
              })
              .join("; ");
          }
          if (typeof value === "boolean") return value ? "Yes" : "No";
          if (value && typeof value === "object") return JSON.stringify(value);
          if (typeof value === "number" || typeof value === "string") return String(value);
          return "";
        }),
      );

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${String(cell)}"`).join(",")),
      ].join("\n");

      const filename = "students_export.csv";
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      alert("Failed to export students. Please try again.");
    }
  };

  // Sort locally for current page
  const sortedStudents = [...students].sort((a, b) => {
    const nameA = `${a.preferred_name ?? a.legal_first_name} ${a.legal_last_name}`.toLowerCase();
    const nameB = `${b.preferred_name ?? b.legal_first_name} ${b.legal_last_name}`.toLowerCase();
    return sortOrder === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
  });

  const toggleSort = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="px-2.5 py-10">
      <div className="mb-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative max-w-md flex-1">
            <svg
              className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search by name, email, or student code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-card border-border focus:border-muted-foreground w-full rounded-md border py-2 pr-3 pl-10 text-sm focus:outline-none"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="bg-card border-border hover:bg-accent relative flex items-center gap-2 rounded-md border px-4 py-2 text-sm transition-colors"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
              />
            </svg>
            Filters
            {(initialFilters.program !== "all" || initialFilters.course !== "all") && (
              <span className="ml-1 text-xs font-medium text-[#a51d31]">
                ({[initialFilters.program !== "all", initialFilters.course !== "all"].filter(Boolean).length})
              </span>
            )}
          </button>

          <div className="flex-1"></div>

          <button
            onClick={() => void handleExportCSV()}
            className="bg-card border-border hover:bg-accent rounded-md border px-4 py-2 text-sm transition-colors"
          >
            Export CSV
          </button>

          <Link href="/dashboard/newstudent">
            <button className="rounded-md bg-[#a51d31] px-4 py-2 text-sm text-white transition-colors hover:bg-[#8b1929]">
              Add Student
            </button>
          </Link>
        </div>

        {showFilters && (
          <div className="bg-card border-border rounded-lg border p-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-foreground mb-1.5 block text-xs font-medium">Program</label>
                <select
                  value={initialFilters.program}
                  onChange={(e) => handleProgramChange(e.target.value)}
                  className="bg-card border-border hover:bg-accent rounded-md border px-4 py-2 text-sm transition-colors"
                >
                  <option value="all">All Programs</option>
                  {programs.map((program) => (
                    <option key={program.id} value={program.id}>
                      {program.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-foreground mb-1.5 block text-xs font-medium">Session</label>
                <select className="bg-card border-border hover:bg-accent rounded-md border px-4 py-2 text-sm transition-colors">
                  <option>All Sessions</option>
                </select>
              </div>
              <div>
                <label className="text-foreground mb-1.5 block text-xs font-medium">Course</label>
                <select
                  value={initialFilters.course}
                  onChange={(e) => handleCourseChange(e.target.value)}
                  className="bg-card border-border hover:bg-accent rounded-md border px-4 py-2 text-sm transition-colors"
                >
                  <option value="all">All Courses</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {selectedRows.size > 0 && (
          <div className="bg-card border-border flex items-center justify-between rounded-lg border px-4 py-2 text-sm">
            <span className="text-foreground font-medium">{selectedRows.size} student(s) selected</span>
          </div>
        )}
      </div>

      <div className={`border-border overflow-hidden rounded-lg border ${isPending ? "opacity-50" : ""}`}>
        <Table.Root variant="surface" className="w-full">
          <Table.Header>
            <Table.Row className="bg-muted/50">
              <Table.ColumnHeaderCell className="w-[60px] border-r text-center" style={{ padding: "12px 16px" }}>
                <input
                  type="checkbox"
                  checked={sortedStudents.length > 0 && sortedStudents.every((student) => selectedRows.has(student.id))}
                  onChange={handleSelectAll}
                  style={{ width: "18px", height: "18px" }}
                />
              </Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell
                onClick={toggleSort}
                className="hover:bg-muted cursor-pointer select-none"
                style={{
                  textAlign: "left",
                  padding: "12px 16px",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Name {sortOrder === "asc" ? "▲" : "▼"}
              </Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell
                style={{
                  textAlign: "left",
                  padding: "12px 16px",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Email
              </Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell
                style={{
                  textAlign: "left",
                  padding: "12px 16px",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Phone
              </Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell
                style={{
                  textAlign: "left",
                  padding: "12px 16px",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Student Code
              </Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell
                style={{
                  textAlign: "left",
                  padding: "12px 16px",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Program
              </Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell
                style={{
                  textAlign: "left",
                  padding: "12px 16px",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Current Course
              </Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell
                style={{
                  textAlign: "center",
                  padding: "12px 16px",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                View More
              </Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {sortedStudents.map((student) => (
              <Table.Row
                key={student.id}
                className={`border-border border-b transition-colors ${selectedRows.has(student.id) ? "bg-accent" : "hover:bg-muted/50"} `}
              >
                <Table.Cell className="text-center" style={{ padding: "12px 16px" }}>
                  <input
                    type="checkbox"
                    checked={selectedRows.has(student.id)}
                    onChange={() => handleCheckboxChange(student.id)}
                    className="h-4 w-4 rounded border-gray-300 text-[#a51d31] focus:ring-[#a51d31]"
                  />
                </Table.Cell>
                <Table.Cell className="font-medium" style={{ padding: "12px 16px", fontSize: "0.875rem" }}>
                  {student.preferred_name ?? student.legal_first_name} {student.legal_last_name.charAt(0)}
                </Table.Cell>
                <Table.Cell className="text-muted-foreground" style={{ padding: "12px 16px", fontSize: "0.875rem" }}>
                  {student.email}
                </Table.Cell>
                <Table.Cell className="text-muted-foreground" style={{ padding: "12px 16px", fontSize: "0.875rem" }}>
                  {student.phone}
                </Table.Cell>
                <Table.Cell className="text-muted-foreground font-mono text-xs" style={{ padding: "12px 16px" }}>
                  {student.student_code ?? "—"}
                </Table.Cell>
                <Table.Cell className="text-muted-foreground" style={{ padding: "12px 16px", fontSize: "0.875rem" }}>
                  {student.program?.name ?? "—"}
                </Table.Cell>
                <Table.Cell className="text-muted-foreground" style={{ padding: "12px 16px", fontSize: "0.875rem" }}>
                  {student.course_placement?.name ?? "—"}
                </Table.Cell>
                <Table.Cell className="text-center" style={{ padding: "12px 16px" }}>
                  <StudentModal studentId={student.id}></StudentModal>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </div>

      {/* Pagination Controls */}
      <div className="relative mt-4">
        <div className="flex items-center justify-between text-sm">
          <div className="text-muted-foreground">
            Showing <span className="text-foreground font-medium">{(pagination.currentPage - 1) * 20 + 1}</span> to{" "}
            <span className="text-foreground font-medium">{Math.min(pagination.currentPage * 20, pagination.totalCount)}</span> of{" "}
            <span className="text-foreground font-medium">{pagination.totalCount}</span> students
          </div>
          <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2">
            <button
              onClick={() => handlePageChange(Math.max(1, pagination.currentPage - 1))}
              disabled={pagination.currentPage === 1}
              className="bg-card border-border hover:bg-accent rounded-md border px-4 py-2 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              Prev
            </button>
            <span className="text-foreground px-3">
              Page {pagination.currentPage} of {Math.max(1, pagination.totalPages)}
            </span>
            <button
              onClick={() => handlePageChange(Math.min(pagination.totalPages, pagination.currentPage + 1))}
              disabled={pagination.currentPage >= pagination.totalPages}
              className="bg-card border-border hover:bg-accent rounded-md border px-4 py-2 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div></div>
        </div>
      </div>
    </div>
  );
}
