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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { LookupItem, SessionWithDetails } from "@/lib/lookup-data";
import { Table } from "@radix-ui/themes";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createSession, updateSessionStatus } from "./actions";

const QUARTERS = ["Winter", "Spring", "Summer", "Fall"] as const;
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR + i - 1);

interface SessionsTableProps {
  sessions: SessionWithDetails[];
  courses: LookupItem[];
}

export default function SessionsTable({ sessions, courses }: SessionsTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create form state
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedQuarter, setSelectedQuarter] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>(String(CURRENT_YEAR));

  const handleCreateSession = async () => {
    if (!selectedCourse || !selectedQuarter || !selectedYear) {
      setError("Please fill in all fields");
      return;
    }

    setError(null);
    const result = await createSession({
      course_placement_id: selectedCourse,
      quarter: selectedQuarter as (typeof QUARTERS)[number],
      year: parseInt(selectedYear),
      status: "active",
    });

    if (!result.success) {
      setError(result.error ?? "Failed to create session");
      return;
    }

    setShowCreateModal(false);
    setSelectedCourse("");
    setSelectedQuarter("");
    setSelectedYear(String(CURRENT_YEAR));
    startTransition(() => {
      router.refresh();
    });
  };

  const handleMarkCompleted = async (sessionId: number) => {
    const confirmed = confirm("Are you sure you want to mark this session as completed?");
    if (!confirmed) return;

    const result = await updateSessionStatus(sessionId, "completed");
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
    };
    return (
      <span className={`rounded-full px-2 py-1 text-xs font-medium ${styles[status as keyof typeof styles] || ""}`}>
        {status}
      </span>
    );
  };

  return (
    <div>
      {/* Actions */}
      <div className="mb-4 flex items-center justify-between">
        <div className="text-muted-foreground text-sm">{sessions.length} session(s)</div>
        <Button onClick={() => setShowCreateModal(true)}>Create Session</Button>
      </div>

      {/* Sessions Table */}
      <div className={`border-border overflow-hidden rounded-lg border ${isPending ? "opacity-50" : ""}`}>
        <Table.Root variant="surface" className="w-full">
          <Table.Header>
            <Table.Row className="bg-muted/50">
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
                Session
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
                Quarter
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
                Year
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
                Enrolled
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
                Status
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
                Actions
              </Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {sessions.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={6} className="py-8 text-center">
                  <p className="text-muted-foreground">No sessions yet. Create one to get started.</p>
                </Table.Cell>
              </Table.Row>
            ) : (
              sessions.map((session) => (
                <Table.Row key={session.id} className="border-border hover:bg-muted/50 border-b transition-colors">
                  <Table.Cell className="font-medium" style={{ padding: "12px 16px", fontSize: "0.875rem" }}>
                    {session.course_name}
                  </Table.Cell>
                  <Table.Cell className="text-muted-foreground" style={{ padding: "12px 16px", fontSize: "0.875rem" }}>
                    {session.quarter}
                  </Table.Cell>
                  <Table.Cell className="text-muted-foreground" style={{ padding: "12px 16px", fontSize: "0.875rem" }}>
                    {session.year}
                  </Table.Cell>
                  <Table.Cell className="text-center" style={{ padding: "12px 16px", fontSize: "0.875rem" }}>
                    <span className="font-medium">{session.enrolled_count}</span>
                  </Table.Cell>
                  <Table.Cell className="text-center" style={{ padding: "12px 16px" }}>
                    {getStatusBadge(session.status)}
                  </Table.Cell>
                  <Table.Cell className="text-center" style={{ padding: "12px 16px" }}>
                    <div className="flex items-center justify-center gap-2">
                      <Link href={`/dashboard/sessions/${session.id}`}>
                        <Button variant="outline" size="sm">
                          Manage
                        </Button>
                      </Link>
                      <Link href={`/dashboard/students?session=${session.id}`}>
                        <Button variant="ghost" size="sm">
                          View Students
                        </Button>
                      </Link>
                      {session.status === "active" && (
                        <Button variant="ghost" size="sm" onClick={() => handleMarkCompleted(session.id)}>
                          Complete
                        </Button>
                      )}
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))
            )}
          </Table.Body>
        </Table.Root>
      </div>

      {/* Create Session Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Session</DialogTitle>
            <DialogDescription>Create a new session for a course. Select the course, quarter, and year.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </div>
            )}
            <div className="grid gap-2">
              <label htmlFor="course" className="text-sm font-medium">
                Course
              </label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label htmlFor="quarter" className="text-sm font-medium">
                  Quarter
                </label>
                <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select quarter" />
                  </SelectTrigger>
                  <SelectContent>
                    {QUARTERS.map((quarter) => (
                      <SelectItem key={quarter} value={quarter}>
                        {quarter}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <label htmlFor="year" className="text-sm font-medium">
                  Year
                </label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {YEARS.map((year) => (
                      <SelectItem key={year} value={String(year)}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleCreateSession()}>Create Session</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
