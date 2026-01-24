import { requireAdmin } from "@/lib/server-utils";
import { redirect } from "next/navigation";
import { getAssessments, getCourses, getPrograms } from "./actions";
import AdminDashboard from "./admin-dashboard";

export default async function AdminPage() {
  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    redirect("/settings/profile");
  }

  const [programs, courses, assessments] = await Promise.all([
    getPrograms(),
    getCourses(),
    getAssessments(),
  ]);

  return (
    <AdminDashboard
      programs={programs}
      courses={courses}
      assessments={assessments}
    />
  );
}
