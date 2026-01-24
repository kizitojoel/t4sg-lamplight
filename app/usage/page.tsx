export default function UsagePage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="mb-2 text-3xl font-bold">How to Use Lamplight</h1>
      <p className="text-muted-foreground mb-10">
        A quick guide to managing students and sessions.
      </p>

      {/* Students Section */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold">Students</h2>
        <p className="text-muted-foreground mb-4">
          The Students page is your central hub for viewing and managing all student records.
        </p>
        <ul className="text-muted-foreground list-inside list-disc space-y-2">
          <li>
            <strong>Search</strong> — Type a name, email, or student code to find someone quickly.
          </li>
          <li>
            <strong>Filter</strong> — Click "Filters" to narrow down by program or course.
          </li>
          <li>
            <strong>View details</strong> — Click "View More" on any row to see the full student profile.
          </li>
          <li>
            <strong>Add a student</strong> — Click the red "Add Student" button to create a new record manually.
          </li>
          <li>
            <strong>Export</strong> — Select students with checkboxes, then click "Export CSV" to download their data.
          </li>
        </ul>
      </section>

      {/* Importing Section */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold">Importing Students</h2>
        <p className="text-muted-foreground mb-4">
          You can import students in bulk from a CSV file (like a Google Sheets export).
        </p>
        <ol className="text-muted-foreground list-inside list-decimal space-y-2">
          <li>Scroll to the bottom of the Students page and click "Import from Google Sheets".</li>
          <li>Select the program (ESOL or HCP).</li>
          <li>For ESOL, choose the course placement. For HCP, it reads from the "Placement Decision" column.</li>
          <li>Pick your CSV file. The system will validate and import the records.</li>
          <li>If there are errors, you'll see a report explaining what went wrong.</li>
        </ol>
        <p className="text-muted-foreground mt-3 text-sm">
          Tip: Make sure your CSV has an "Is returning" column. Returning students need a valid student code.
        </p>
      </section>

      {/* Sessions Section */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold">Sessions</h2>
        <p className="text-muted-foreground mb-4">
          Sessions let you track which students are enrolled in a specific course during a specific term.
        </p>
        <ul className="text-muted-foreground list-inside list-disc space-y-2">
          <li>
            <strong>Create a session</strong> — Click "Create Session", pick a course, quarter (Winter/Spring/Summer/Fall), and year.
          </li>
          <li>
            <strong>Add students</strong> — Click "Manage" on a session, then "Add Students". Search for students and check the ones you want to add.
          </li>
          <li>
            <strong>View enrolled students</strong> — Click "View Students" to see the Students page filtered to that session.
          </li>
          <li>
            <strong>Complete a session</strong> — When the term ends, click "Complete" to archive it.
          </li>
        </ul>
        <p className="text-muted-foreground mt-3 text-sm">
          When you add a student to a new session, their previous enrollment is automatically marked as completed.
        </p>
      </section>

      {/* Student Profiles Section */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold">Student Profiles</h2>
        <p className="text-muted-foreground mb-4">
          Each student has a detailed profile with multiple tabs.
        </p>
        <ul className="text-muted-foreground list-inside list-disc space-y-2">
          <li>
            <strong>Info</strong> — Basic details like name, contact info, and demographics.
          </li>
          <li>
            <strong>Advising</strong> — Update their program and course placement. Add advising notes.
          </li>
          <li>
            <strong>Learning</strong> — Track assessments and academic progress.
          </li>
        </ul>
        <p className="text-muted-foreground mt-3 text-sm">
          Click "Edit" to make changes, then "Save" when you're done.
        </p>
      </section>

      {/* Quick Tips */}
      <section className="border-border rounded-lg border bg-gray-50 p-6 dark:bg-gray-900">
        <h2 className="mb-3 text-lg font-semibold">Quick Tips</h2>
        <ul className="text-muted-foreground space-y-2 text-sm">
          <li>• Student codes look like <code className="bg-muted rounded px-1">STU-12345</code> — use them to find returning students.</li>
          <li>• The search bar works across names, emails, and student codes.</li>
          <li>• Sessions are organized by course + quarter + year. Create one for each class you run.</li>
          <li>• You can have only one "current" session per student. Adding them to a new session archives the old one.</li>
        </ul>
      </section>
    </div>
  );
}
