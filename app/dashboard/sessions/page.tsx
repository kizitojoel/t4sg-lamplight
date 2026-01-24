import { getCoursePlacements, getSessions } from "@/lib/lookup-data";
import { getAuthenticatedUser } from "@/lib/server-utils";
import { redirect } from "next/navigation";
import SessionsTable from "./sessionsTable";

export default async function SessionsPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/");
  }

  const [sessions, courses] = await Promise.all([getSessions(), getCoursePlacements()]);

  return (
    <div className="px-2.5 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Sessions</h1>
        <p className="text-muted-foreground mt-2">
          Manage course sessions and student enrollments. Each session is a specific course offered during a quarter.
        </p>
      </div>
      <SessionsTable sessions={sessions} courses={courses} />
    </div>
  );
}
