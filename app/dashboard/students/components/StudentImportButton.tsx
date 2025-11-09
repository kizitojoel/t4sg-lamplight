"use client";

import type { Constants } from "@/lib/schema";
import Papa from "papaparse";
import { useState } from "react";
import { isValidStudent, mapCSVRowToStudent, type CSVRow } from "../utils/csvMapper";
import { importStudentsToSupabase } from "../utils/studentImporter";
import { LoadingOverlay } from "./LoadingOverlay";
import { StudentImportModal } from "./StudentImportModal";
import { Toast } from "./Toast";

type ToastState = {
  show: boolean;
  message: string;
  type: "success" | "error";
} | null;

type ProgramEnum = (typeof Constants.public.Enums.program_enum)[number];
type CoursePlacementEnum = (typeof Constants.public.Enums.course_placement_enum)[number];

export default function StudentImportButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importMessage, setImportMessage] = useState("");
  const [toast, setToast] = useState<ToastState>(null);

  const handleButtonClick = () => {
    setIsModalOpen(true);
  };

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
  };

  const closeToast = () => {
    setToast(null);
  };

  const handleFileSelect = (file: File, program: ProgramEnum, coursePlacement: CoursePlacementEnum): void => {
    // Validate file type
    if (!file.name.endsWith(".csv")) {
      showToast("Please upload a CSV file", "error");
      return;
    }

    setIsImporting(true);
    setImportMessage("Reading CSV file...");

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        void (async () => {
          try {
            // Step 1: Validate CSV
            setImportMessage("Validating data...");
            await sleep(300);

            if ((results.data ?? []).length === 0) {
              showToast("CSV file is empty", "error");
              setIsImporting(false);
              return;
            }

            // Step 2: Map CSV rows
            setImportMessage("Mapping student data...");
            await sleep(300);

            const mappedStudents = (results.data as CSVRow[]).map(mapCSVRowToStudent);
            // Apply program and course_placement to all students
            const studentsWithProgramAndPlacement = mappedStudents.map(
              (student): Record<string, unknown> => ({
                ...student,
                program,
                course_placement: coursePlacement,
              }),
            );
            const validStudents = studentsWithProgramAndPlacement.filter(isValidStudent);

            if (validStudents.length === 0) {
              showToast("No valid student records found in CSV. Please check the file format.", "error");
              setIsImporting(false);
              return;
            }

            // Step 3: Import to database
            setImportMessage(`Uploading ${validStudents.length} students to database...`);
            await sleep(300);

            const result = await importStudentsToSupabase(
              validStudents as Parameters<typeof importStudentsToSupabase>[0],
            );

            // Step 4: Show result
            setIsImporting(false);

            if (result.success) {
              showToast(`Successfully imported ${result.count} students!`, "success");

              // Refresh page after a short delay
              setTimeout(() => {
                window.location.reload();
              }, 1500);
            } else {
              showToast(`Import failed: ${result.error}`, "error");
            }
          } catch {
            showToast("Failed to import students.", "error");
            setIsImporting(false);
          }
        })();
      },
      error: () => {
        showToast("Failed to parse CSV file", "error");
        setIsImporting(false);
      },
    });
  };

  return (
    <>
      {/* Import button */}
      <button
        onClick={handleButtonClick}
        disabled={isImporting}
        className="bg-accent cursor-pointer rounded-2xl px-5 py-3"
        style={{
          cursor: isImporting ? "not-allowed" : "pointer",
          opacity: isImporting ? 0.6 : 1,
        }}
      >
        {isImporting ? "Importing..." : "Import from Google Sheets"}
      </button>

      {/* Import Modal */}
      <StudentImportModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onFileSelect={(file, program, coursePlacement) => {
          void handleFileSelect(file, program, coursePlacement);
        }}
      />

      {/* Loading overlay */}
      {isImporting && <LoadingOverlay message={importMessage} />}

      {/* Toast notification */}
      {toast?.show && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
    </>
  );
}

// Helper function for delays
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
