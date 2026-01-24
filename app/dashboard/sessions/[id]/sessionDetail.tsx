"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table } from "@radix-ui/themes";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { addStudentToSession, removeStudentFromSession, searchStudentsNotInSession, updateSessionStatus } from "../actions";

interface Student {
  id: string;
  student_code: string | null;
  legal_first_name: string;
  legal_last_name: string;
  preferred_name: string | null;
  email: string | null;
}

interface Enrollment {
  id: string;
  is_current: boolean;
  status: string;
  enrolled_at: string;
  student: Student | null;
}

interface Session {
  id: number;
  course_name: string;
  quarter: string;
  year: number;
  status: string;
  display_name: string;
  enrolled_count: number;
}

interface SessionDetailProps {
  session: Session;
  enrollments: Enrollment[];
}

export default function SessionDetail({ session, enrollments }: SessionDetailProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search for students
  const handleSearch = useCallback(async () => {
    setIsSearching(true);
    const results = await searchStudentsNotInSession(session.id, searchQuery);
    setSearchResults(results as Student[]);
    setIsSearching(false);
  }, [session.id, searchQuery]);

  // Debounced search
  useEffect(() => {
    if (!showAddModal) return;

    const timer = setTimeout(() => {
      void handleSearch();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, showAddModal, handleSearch]);

  // Load initial results when modal opens
  useEffect(() => {
    if (showAddModal) {
      void handleSearch();
    }
  }, [showAddModal, handleSearch]);

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  };

  const handleAddStudents = async () => {
    if (selectedStudents.size === 0) return;

    setIsAdding(true);
    setError(null);

    const results = await Promise.all(
      Array.from(selectedStudents).map((studentId) => addStudentToSession(studentId, session.id)),
    );

    const failed = results.filter((r) => !r.success);
    if (failed.length > 0) {
      setError(`Failed to add ${failed.length} student(s): ${failed[0]?.error ?? "Unknown error"}`);
    }

    setIsAdding(false);
    setSelectedStudents(new Set());
    setShowAddModal(false);

    startTransition(() => {
      router.refresh();
    });
  };

  const handleRemoveStudent = async (studentId: string, studentName: string) => {
    const confirmed = confirm(`Are you sure you want to remove ${studentName} from this session?`);
    if (!confirmed) return;

    const result = await removeStudentFromSession(studentId, session.id);
    if (!result.success) {
      alert(result.error ?? "Failed to remove student");
      return;
    }

    startTransition(() => {
      router.refresh();
    });
  };

  const handleMarkCompleted = async () => {
    const confirmed = confirm("Are you sure you want to mark this session as completed? This will affect all enrolled students.");
    if (!confirmed) return;

    const result = await updateSessionStatus(session.id, "completed");
    if (!result.success) {
      alert(result.error ?? "Failed to update session");
      return;
    }

    startTransition(() => {
      router.refresh();
    });
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      upcoming: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      completed: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
      enrolled: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      dropped: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
    return (
      <span className={`rounded-full px-2 py-1 text-xs font-medium ${styles[status as keyof typeof styles] || ""}`}>
        {status}
      </span>
    );
  };

  const currentEnrollments = enrollments.filter((e) => e.is_current && e.status === "enrolled");
  const pastEnrollments = enrollments.filter((e) => !e.is_current || e.status !== "enrolled");

  return (
    <div className={isPending ? "opacity-50" : ""}>
      {/* Header */}
      <div className="mb-6">
        <Link href="/dashboard/sessions" className="text-muted-foreground mb-2 flex items-center gap-1 text-sm hover:underline">
          ← Back to Sessions
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{session.display_name}</h1>
            <div className="mt-2 flex items-center gap-3">
              {getStatusBadge(session.status)}
              <span className="text-muted-foreground text-sm">
                {currentEnrollments.length} student(s) currently enrolled
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setShowAddModal(true)}>Add Students</Button>
            {session.status === "active" && (
              <Button variant="outline" onClick={() => void handleMarkCompleted()}>
                Mark as Completed
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Current Enrollments */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">Currently Enrolled Students</h2>
        <div className="border-border overflow-hidden rounded-lg border">
          <Table.Root variant="surface" className="w-full">
            <Table.Header>
              <Table.Row className="bg-muted/50">
                <Table.ColumnHeaderCell style={{ padding: "12px 16px", fontSize: "0.75rem", fontWeight: 600 }}>
                  STUDENT CODE
                </Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell style={{ padding: "12px 16px", fontSize: "0.75rem", fontWeight: 600 }}>
                  NAME
                </Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell style={{ padding: "12px 16px", fontSize: "0.75rem", fontWeight: 600 }}>
                  EMAIL
                </Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell style={{ padding: "12px 16px", fontSize: "0.75rem", fontWeight: 600 }}>
                  ENROLLED
                </Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell style={{ padding: "12px 16px", fontSize: "0.75rem", fontWeight: 600, textAlign: "center" }}>
                  ACTIONS
                </Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {currentEnrollments.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={5} className="py-8 text-center">
                    <p className="text-muted-foreground">No students currently enrolled. Add students to get started.</p>
                  </Table.Cell>
                </Table.Row>
              ) : (
                currentEnrollments.map((enrollment) => (
                  <Table.Row key={enrollment.id} className="border-border hover:bg-muted/50 border-b">
                    <Table.Cell className="font-mono text-xs" style={{ padding: "12px 16px" }}>
                      {enrollment.student?.student_code ?? "—"}
                    </Table.Cell>
                    <Table.Cell className="font-medium" style={{ padding: "12px 16px", fontSize: "0.875rem" }}>
                      {enrollment.student?.preferred_name ?? enrollment.student?.legal_first_name}{" "}
                      {enrollment.student?.legal_last_name}
                    </Table.Cell>
                    <Table.Cell className="text-muted-foreground" style={{ padding: "12px 16px", fontSize: "0.875rem" }}>
                      {enrollment.student?.email ?? "—"}
                    </Table.Cell>
                    <Table.Cell className="text-muted-foreground" style={{ padding: "12px 16px", fontSize: "0.875rem" }}>
                      {new Date(enrollment.enrolled_at).toLocaleDateString()}
                    </Table.Cell>
                    <Table.Cell style={{ padding: "12px 16px", textAlign: "center" }}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() =>
                          void handleRemoveStudent(
                            enrollment.student?.id ?? "",
                            `${enrollment.student?.legal_first_name} ${enrollment.student?.legal_last_name}`,
                          )
                        }
                      >
                        Remove
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                ))
              )}
            </Table.Body>
          </Table.Root>
        </div>
      </div>

      {/* Past Enrollments */}
      {pastEnrollments.length > 0 && (
        <div>
          <h2 className="mb-4 text-xl font-semibold">Past Enrollments</h2>
          <div className="border-border overflow-hidden rounded-lg border">
            <Table.Root variant="surface" className="w-full">
              <Table.Header>
                <Table.Row className="bg-muted/50">
                  <Table.ColumnHeaderCell style={{ padding: "12px 16px", fontSize: "0.75rem", fontWeight: 600 }}>
                    STUDENT CODE
                  </Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell style={{ padding: "12px 16px", fontSize: "0.75rem", fontWeight: 600 }}>
                    NAME
                  </Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell style={{ padding: "12px 16px", fontSize: "0.75rem", fontWeight: 600 }}>
                    STATUS
                  </Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell style={{ padding: "12px 16px", fontSize: "0.75rem", fontWeight: 600 }}>
                    ENROLLED
                  </Table.ColumnHeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {pastEnrollments.map((enrollment) => (
                  <Table.Row key={enrollment.id} className="border-border hover:bg-muted/50 border-b">
                    <Table.Cell className="font-mono text-xs" style={{ padding: "12px 16px" }}>
                      {enrollment.student?.student_code ?? "—"}
                    </Table.Cell>
                    <Table.Cell className="font-medium" style={{ padding: "12px 16px", fontSize: "0.875rem" }}>
                      {enrollment.student?.preferred_name ?? enrollment.student?.legal_first_name}{" "}
                      {enrollment.student?.legal_last_name}
                    </Table.Cell>
                    <Table.Cell style={{ padding: "12px 16px" }}>{getStatusBadge(enrollment.status)}</Table.Cell>
                    <Table.Cell className="text-muted-foreground" style={{ padding: "12px 16px", fontSize: "0.875rem" }}>
                      {new Date(enrollment.enrolled_at).toLocaleDateString()}
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </div>
        </div>
      )}

      {/* Add Students Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add Students to Session</DialogTitle>
            <DialogDescription>
              Search for students and select them to add to this session. Students already in this session are not shown.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {error && (
              <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </div>
            )}
            <div className="mb-4">
              <Input
                placeholder="Search by name, email, or student code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="max-h-[300px] overflow-y-auto rounded-md border">
              {isSearching ? (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">Searching...</p>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">
                    {searchQuery ? "No students found" : "Enter a search term to find students"}
                  </p>
                </div>
              ) : (
                <Table.Root variant="surface" className="w-full">
                  <Table.Body>
                    {searchResults.map((student) => (
                      <Table.Row
                        key={student.id}
                        className={`cursor-pointer border-b transition-colors ${
                          selectedStudents.has(student.id) ? "bg-accent" : "hover:bg-muted/50"
                        }`}
                        onClick={() => toggleStudentSelection(student.id)}
                      >
                        <Table.Cell style={{ padding: "12px 16px", width: "40px" }}>
                          <input
                            type="checkbox"
                            checked={selectedStudents.has(student.id)}
                            onChange={() => toggleStudentSelection(student.id)}
                            className="h-4 w-4"
                          />
                        </Table.Cell>
                        <Table.Cell className="font-mono text-xs" style={{ padding: "12px 16px" }}>
                          {student.student_code ?? "—"}
                        </Table.Cell>
                        <Table.Cell className="font-medium" style={{ padding: "12px 16px", fontSize: "0.875rem" }}>
                          {student.preferred_name ?? student.legal_first_name} {student.legal_last_name}
                        </Table.Cell>
                        <Table.Cell className="text-muted-foreground" style={{ padding: "12px 16px", fontSize: "0.875rem" }}>
                          {student.email ?? "—"}
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              )}
            </div>
            {selectedStudents.size > 0 && (
              <div className="mt-4 text-sm text-muted-foreground">
                {selectedStudents.size} student(s) selected
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleAddStudents()} disabled={selectedStudents.size === 0 || isAdding}>
              {isAdding ? "Adding..." : `Add ${selectedStudents.size} Student(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
