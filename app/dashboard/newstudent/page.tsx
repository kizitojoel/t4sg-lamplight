import { getAllLookupData } from "@/lib/lookup-data";
import { getAuthenticatedUser } from "@/lib/server-utils";
import { redirect } from "next/navigation";
import AddStudentForm from "./AddStudentForm";

export default async function NewStudentPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/");
  }

  // Use centralized lookup data fetching (cached per-request)
  const { programs, coursePlacements } = await getAllLookupData();

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-96">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Student</h1>
      </div>
      <AddStudentForm programs={programs} courses={coursePlacements} />
    </div>
  );
}
