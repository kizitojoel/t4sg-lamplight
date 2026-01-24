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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/solid";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  createAssessment,
  createCourse,
  createProgram,
  deleteAssessment,
  deleteCourse,
  deleteProgram,
  updateAssessment,
  updateCourse,
  updateProgram,
} from "./actions";

interface Program {
  id: string;
  name: string;
  active: boolean;
  created_at: string;
}
interface Course {
  id: string;
  name: string;
  active: boolean;
  created_at: string;
}
interface Assessment {
  id: string;
  name: string;
  active: boolean;
  course_id: string | null;
  created_at: string;
}

interface AdminDashboardProps {
  programs: Program[];
  courses: Course[];
  assessments: Assessment[];
}

type ModalType = "program" | "course" | "assessment" | null;
type ModalMode = "create" | "edit";

export default function AdminDashboard({ programs, courses, assessments }: AdminDashboardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Search states
  const [programSearch, setProgramSearch] = useState("");
  const [courseSearch, setCourseSearch] = useState("");
  const [assessmentSearch, setAssessmentSearch] = useState("");

  // Modal states
  const [modalType, setModalType] = useState<ModalType>(null);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formActive, setFormActive] = useState(true);
  const [formCourseId, setFormCourseId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Delete confirmation
  const [deleteModal, setDeleteModal] = useState<{
    type: ModalType;
    id: string;
    name: string;
  } | null>(null);

  const openCreateModal = (type: ModalType) => {
    setModalType(type);
    setModalMode("create");
    setEditingId(null);
    setFormName("");
    setFormActive(true);
    setFormCourseId(null);
    setError(null);
  };

  const openEditModal = (
    type: ModalType,
    item: { id: string; name: string; active: boolean; course_id?: string | null },
  ) => {
    setModalType(type);
    setModalMode("edit");
    setEditingId(item.id);
    setFormName(item.name);
    setFormActive(item.active);
    setFormCourseId(item.course_id ?? null);
    setError(null);
  };

  const closeModal = () => {
    setModalType(null);
    setEditingId(null);
    setFormName("");
    setFormActive(true);
    setFormCourseId(null);
    setError(null);
  };

  const handleSubmit = () => {
    if (!formName.trim()) {
      setError("Name is required");
      return;
    }

    startTransition(async () => {
      let result;

      if (modalMode === "create") {
        if (modalType === "program") {
          result = await createProgram(formName.trim());
        } else if (modalType === "course") {
          result = await createCourse(formName.trim());
        } else if (modalType === "assessment") {
          result = await createAssessment(formName.trim(), formCourseId);
        }
      } else if (editingId) {
        if (modalType === "program") {
          result = await updateProgram(editingId, { name: formName.trim(), active: formActive });
        } else if (modalType === "course") {
          result = await updateCourse(editingId, { name: formName.trim(), active: formActive });
        } else if (modalType === "assessment") {
          result = await updateAssessment(editingId, {
            name: formName.trim(),
            active: formActive,
            course_id: formCourseId,
          });
        }
      }

      if (result && !result.success) {
        setError(result.error ?? "An error occurred");
      } else {
        closeModal();
        router.refresh();
      }
    });
  };

  const handleDelete = () => {
    if (!deleteModal) return;

    startTransition(async () => {
      let result;

      if (deleteModal.type === "program") {
        result = await deleteProgram(deleteModal.id);
      } else if (deleteModal.type === "course") {
        result = await deleteCourse(deleteModal.id);
      } else if (deleteModal.type === "assessment") {
        result = await deleteAssessment(deleteModal.id);
      }

      if (result && !result.success) {
        setError(result.error ?? "An error occurred");
        setDeleteModal(null);
      } else {
        setDeleteModal(null);
        router.refresh();
      }
    });
  };

  const toggleActive = (type: ModalType, id: string, currentActive: boolean) => {
    startTransition(async () => {
      if (type === "program") {
        await updateProgram(id, { active: !currentActive });
      } else if (type === "course") {
        await updateCourse(id, { active: !currentActive });
      } else if (type === "assessment") {
        await updateAssessment(id, { active: !currentActive });
      }
      router.refresh();
    });
  };

  const filteredPrograms = programs.filter((p) => p.name.toLowerCase().includes(programSearch.toLowerCase()));

  const filteredCourses = courses.filter((c) => c.name.toLowerCase().includes(courseSearch.toLowerCase()));

  const filteredAssessments = assessments.filter((a) => a.name.toLowerCase().includes(assessmentSearch.toLowerCase()));

  const getCourseName = (courseId: string | null) => {
    if (!courseId) return "All courses";
    const course = courses.find((c) => c.id === courseId);
    return course?.name ?? "Unknown";
  };

  return (
    <div className={`space-y-10 ${isPending ? "pointer-events-none opacity-50" : ""}`}>
      {/* Error display */}
      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
          <button className="ml-4 underline" onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      )}

      {/* Programs Section */}
      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Programs</h2>
          <Button onClick={() => openCreateModal("program")} size="sm">
            Add Program
          </Button>
        </div>
        <Input
          className="mt-3 max-w-sm"
          placeholder="Search programs..."
          value={programSearch}
          onChange={(e) => setProgramSearch(e.target.value)}
        />
        <div className="mt-4 space-y-2">
          {filteredPrograms.length === 0 ? (
            <p className="text-muted-foreground text-sm">No programs found.</p>
          ) : (
            filteredPrograms.map((program) => (
              <div
                key={program.id}
                className={`flex items-center justify-between rounded-lg border p-3 ${
                  !program.active ? "bg-gray-50 opacity-60 dark:bg-gray-900" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium">{program.name}</span>
                  {!program.active && (
                    <span className="rounded bg-gray-200 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                      Inactive
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => toggleActive("program", program.id, program.active)}>
                    {program.active ? "Deactivate" : "Activate"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openEditModal("program", program)}>
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteModal({ type: "program", id: program.id, name: program.name })}
                  >
                    <TrashIcon className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Courses Section */}
      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Courses</h2>
          <Button onClick={() => openCreateModal("course")} size="sm">
            Add Course
          </Button>
        </div>
        <Input
          className="mt-3 max-w-sm"
          placeholder="Search courses..."
          value={courseSearch}
          onChange={(e) => setCourseSearch(e.target.value)}
        />
        <div className="mt-4 space-y-2">
          {filteredCourses.length === 0 ? (
            <p className="text-muted-foreground text-sm">No courses found.</p>
          ) : (
            filteredCourses.map((course) => (
              <div
                key={course.id}
                className={`flex items-center justify-between rounded-lg border p-3 ${
                  !course.active ? "bg-gray-50 opacity-60 dark:bg-gray-900" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium">{course.name}</span>
                  {!course.active && (
                    <span className="rounded bg-gray-200 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                      Inactive
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => toggleActive("course", course.id, course.active)}>
                    {course.active ? "Deactivate" : "Activate"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openEditModal("course", course)}>
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteModal({ type: "course", id: course.id, name: course.name })}
                  >
                    <TrashIcon className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Assessments Section */}
      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Assessments</h2>
          <Button onClick={() => openCreateModal("assessment")} size="sm">
            Add Assessment
          </Button>
        </div>
        <Input
          className="mt-3 max-w-sm"
          placeholder="Search assessments..."
          value={assessmentSearch}
          onChange={(e) => setAssessmentSearch(e.target.value)}
        />
        <div className="mt-4 space-y-2">
          {filteredAssessments.length === 0 ? (
            <p className="text-muted-foreground text-sm">No assessments found.</p>
          ) : (
            filteredAssessments.map((assessment) => (
              <div
                key={assessment.id}
                className={`flex items-center justify-between rounded-lg border p-3 ${
                  !assessment.active ? "bg-gray-50 opacity-60 dark:bg-gray-900" : ""
                }`}
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{assessment.name}</span>
                    {!assessment.active && (
                      <span className="rounded bg-gray-200 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                        Inactive
                      </span>
                    )}
                  </div>
                  <span className="text-muted-foreground text-xs">
                    Linked to: {getCourseName(assessment.course_id)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleActive("assessment", assessment.id, assessment.active)}
                  >
                    {assessment.active ? "Deactivate" : "Activate"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openEditModal("assessment", assessment)}>
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setDeleteModal({
                        type: "assessment",
                        id: assessment.id,
                        name: assessment.name,
                      })
                    }
                  >
                    <TrashIcon className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Create/Edit Modal */}
      <Dialog open={modalType !== null} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {modalMode === "create" ? "Create" : "Edit"}{" "}
              {modalType === "program" ? "Program" : modalType === "course" ? "Course" : "Assessment"}
            </DialogTitle>
            <DialogDescription>
              {modalMode === "create" ? `Add a new ${modalType} to the system.` : `Update the ${modalType} details.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Name</label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder={`Enter ${modalType} name`}
              />
            </div>
            {modalMode === "edit" && (
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="active-checkbox"
                  checked={formActive}
                  onChange={(e) => setFormActive(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="active-checkbox" className="text-sm">
                  Active
                </label>
              </div>
            )}
            {modalType === "assessment" && (
              <div>
                <label className="mb-1.5 block text-sm font-medium">Linked Course (optional)</label>
                <Select value={formCourseId ?? "none"} onValueChange={(v) => setFormCourseId(v === "none" ? null : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">All courses</SelectItem>
                    {courses
                      .filter((c) => c.active)
                      .map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground mt-1 text-xs">
                  Link this assessment to a specific course, or leave as &quot;All courses&quot; if it applies
                  everywhere.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {modalMode === "create" ? "Create" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModal !== null} onOpenChange={(open) => !open && setDeleteModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {deleteModal?.type}?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteModal?.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModal(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
