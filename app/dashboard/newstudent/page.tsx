import AddStudentForm from "./AddStudentForm";

export default function NewStudentPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-96">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Student</h1>
      </div>
      <AddStudentForm />
    </div>
  );
}
