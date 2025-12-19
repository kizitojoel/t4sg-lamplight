"use client";

import type { Constants } from "@/lib/schema";
import Papa from "papaparse";
import { useState } from "react";
import {
  isValidStudent,
  mapCSVRowToStudent,
  mapHCPPlacementDecisionToEnum,
  splitStudentsByReturningStatus,
  type CSVRow,
  type StudentData,
} from "../utils/csvMapper";
import {
  importNewStudents,
  lookupReturningStudents,
  updateReturningStudents,
  validateNewStudents,
  validateReturningStudents,
} from "../utils/studentImporter";
import { ErrorReportModal, type ErrorInfo } from "./ErrorReportModal";
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
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [importErrors, setImportErrors] = useState<ErrorInfo[]>([]);

  const handleButtonClick = () => {
    setIsModalOpen(true);
  };

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
  };

  const closeToast = () => {
    setToast(null);
  };

  const handleFileSelect = (file: File, program: ProgramEnum, coursePlacement: CoursePlacementEnum | null): void => {
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
            // Step 1: Parse CSV
            setImportMessage("Parsing CSV file...");
            await sleep(300);

            if ((results.data ?? []).length === 0) {
              showToast("CSV file is empty", "error");
              setIsImporting(false);
              return;
            }

            // Step 2: Map CSV rows
            setImportMessage("Mapping student data...");
            await sleep(300);

            const mappedStudents = (results.data as CSVRow[]).map((row) => mapCSVRowToStudent(row, program));

            // Apply program and course_placement to all students
            // For HCP: extract placement from CSV "Placement Decision" column
            // For ESOL: use the provided coursePlacement for all students
            const isHCP = program === "HCP";

            // Validate ESOL has course placement
            if (!isHCP && !coursePlacement) {
              showToast("Course placement is required for ESOL program", "error");
              setIsImporting(false);
              return;
            }

            // Collect placement validation errors for HCP
            const placementErrors: ErrorInfo[] = [];
            const studentsWithProgramAndPlacement = mappedStudents
              .map((student, index): StudentData | null => {
                let placement: string | null = null;

                if (isHCP) {
                  // Extract placement from CSV row
                  const csvRow = results.data[index] as CSVRow | undefined;
                  const placementDecision = csvRow?.["Placement Decision"];
                  placement = mapHCPPlacementDecisionToEnum(placementDecision);

                  // Validate placement for HCP students
                  if (!placement) {
                    const firstName = typeof student.legal_first_name === "string" ? student.legal_first_name : "";
                    const lastName = typeof student.legal_last_name === "string" ? student.legal_last_name : "";
                    const studentName = `${firstName} ${lastName}`.trim() || "Unknown";
                    // Get student code from CSV row directly, fallback to mapped student data
                    const studentCode =
                      (typeof csvRow?.["Student Code"] === "string" ? csvRow["Student Code"] : undefined) ??
                      (typeof student.student_code === "string" ? student.student_code : undefined);
                    placementErrors.push({
                      rowNumber: index + 1,
                      studentName,
                      studentCode,
                      error: `Missing or invalid "Placement Decision" value\nFound: ${placementDecision ?? "empty"}\nExpected: "English TEAS - Spring 2025" or similar\nRow: ${index + 1}`,
                      errorType: "VALIDATION_ERROR",
                    });
                    return null; // Mark as invalid
                  }
                } else {
                  // ESOL: use the provided coursePlacement
                  placement = coursePlacement as string;
                }

                return {
                  ...student,
                  program,
                  course_placement: placement,
                };
              })
              .filter((student): student is StudentData => student !== null);

            // Step 3: Basic validation - required fields
            setImportMessage("Validating student records...");
            await sleep(300);

            const validStudents = studentsWithProgramAndPlacement.filter(isValidStudent);

            if (validStudents.length === 0) {
              showToast("No valid student records found in CSV. Please check the file format.", "error");
              setIsImporting(false);
              return;
            }

            // Step 4: Split into new/returning/invalid
            setImportMessage("Categorizing students...");
            await sleep(300);

            const splitResult = splitStudentsByReturningStatus(validStudents);

            // Collect errors from invalid students
            // Start with placement errors (for HCP students with invalid/missing placements)
            const allErrors: ErrorInfo[] = [...placementErrors];
            for (let i = 0; i < splitResult.invalidStudents.length; i++) {
              const invalid = splitResult.invalidStudents[i];
              if (!invalid) continue;
              const firstName =
                typeof invalid.student.legal_first_name === "string" ? invalid.student.legal_first_name : "";
              const lastName =
                typeof invalid.student.legal_last_name === "string" ? invalid.student.legal_last_name : "";
              const studentName = `${firstName} ${lastName}`.trim() || "Unknown";
              // Get student code from mapped student data, or try to get from original CSV row
              const csvRow = results.data[i] as CSVRow | undefined;
              const studentCode =
                (typeof invalid.student.student_code === "string" ? invalid.student.student_code : undefined) ??
                (typeof csvRow?.["Student Code"] === "string" ? csvRow["Student Code"] : undefined);
              allErrors.push({
                rowNumber: i + 1,
                studentName,
                studentCode,
                error: invalid.error,
                errorType: "VALIDATION_ERROR",
              });
            }

            // PHASE 1: VALIDATION Before any database writes

            // Step 5: Validate ALL new students
            const newStudentRowOffset = splitResult.invalidStudents.length;
            if (splitResult.newStudents.length > 0) {
              setImportMessage(
                `Validating ${splitResult.newStudents.length} new student${splitResult.newStudents.length !== 1 ? "s" : ""}...`,
              );
              await sleep(300);

              const validationResult = await validateNewStudents(splitResult.newStudents, newStudentRowOffset);

              if (validationResult.errors.length > 0) {
                allErrors.push(
                  ...validationResult.errors.map((e) => ({
                    rowNumber: e.rowNumber,
                    studentName: e.studentName,
                    studentCode: e.studentCode,
                    error: e.message,
                    errorType: e.errorType,
                  })),
                );
              }
            }

            // Step 6: Validate ALL returning students
            const returningStudentRowOffset = newStudentRowOffset + splitResult.newStudents.length;
            let dbStudentsForUpdates = new Map<string, Record<string, unknown>>();
            if (splitResult.returningStudents.length > 0) {
              setImportMessage(
                `Validating ${splitResult.returningStudents.length} returning student${splitResult.returningStudents.length !== 1 ? "s" : ""}...`,
              );
              await sleep(300);

              const validationResult = await validateReturningStudents(
                splitResult.returningStudents,
                returningStudentRowOffset,
              );

              if (validationResult.errors.length > 0) {
                allErrors.push(
                  ...validationResult.errors.map((e) => ({
                    rowNumber: e.rowNumber,
                    studentName: e.studentName,
                    studentCode: e.studentCode,
                    error: e.message,
                    errorType: e.errorType,
                  })),
                );
              } else {
                // If validation passed, lookup DB students for Phase 2 updates
                const studentCodes = splitResult.returningStudents
                  .map((s) => s.student_code as string)
                  .filter((code): code is string => Boolean(code));
                try {
                  dbStudentsForUpdates = await lookupReturningStudents(studentCodes);
                } catch (error) {
                  // Should not happen if validation passed, but handle errors effectively
                  allErrors.push({
                    rowNumber: 0,
                    studentName: "Validation",
                    error: `Failed to lookup returning students: ${error instanceof Error ? error.message : "Unknown error"}`,
                    errorType: "LOOKUP_FAILED",
                  });
                }
              }
            }

            // Step 7: If any validation errors, abort completely
            if (allErrors.length > 0) {
              setIsImporting(false);
              setImportErrors(allErrors);
              setShowErrorModal(true);
              showToast("Validation failed. Please fix errors and try again.", "error");
              return;
            }

            // PHASE 2: DATABASE WRITES - Only if validation passes

            // Step 8: Insert all new students
            let newCount = 0;
            if (splitResult.newStudents.length > 0) {
              setImportMessage(
                `Importing ${splitResult.newStudents.length} new student${splitResult.newStudents.length !== 1 ? "s" : ""}...`,
              );
              await sleep(300);

              const importResult = await importNewStudents(
                splitResult.newStudents as Parameters<typeof importNewStudents>[0],
                newStudentRowOffset,
              );

              newCount = importResult.newCount;

              // Collect infrastructure errors but with allowance of partial success
              if (importResult.errors.length > 0) {
                allErrors.push(
                  ...importResult.errors.map((e) => ({
                    rowNumber: e.rowNumber,
                    studentName: e.studentName,
                    studentCode: e.studentCode,
                    error: e.message,
                    errorType: e.errorType,
                  })),
                );
              }
            }

            // Step 9: Update all returning students
            let updatedCount = 0;
            if (splitResult.returningStudents.length > 0) {
              setImportMessage(
                `Updating ${splitResult.returningStudents.length} returning student${splitResult.returningStudents.length !== 1 ? "s" : ""}...`,
              );
              await sleep(300);

              const updateResult = await updateReturningStudents(
                splitResult.returningStudents,
                dbStudentsForUpdates,
                returningStudentRowOffset,
              );

              updatedCount = updateResult.updatedCount;

              // Collect infrastructure errors
              if (updateResult.errors.length > 0) {
                allErrors.push(
                  ...updateResult.errors.map((e) => ({
                    rowNumber: e.rowNumber,
                    studentName: e.studentName,
                    studentCode: e.studentCode,
                    error: e.message,
                    errorType: e.errorType,
                  })),
                );
              }
            }

            // Step 10: Show final results
            setIsImporting(false);
            showFinalResults(allErrors, newCount, updatedCount);
          } catch (error) {
            showToast(
              `Failed to import students: ${error instanceof Error ? error.message : "Unknown error"}`,
              "error",
            );
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

  const showFinalResults = (errors: ErrorInfo[], newCount: number, updatedCount: number) => {
    const failedCount = errors.length;

    // Store errors for modal
    if (failedCount > 0) {
      setImportErrors(errors);
    }

    if (failedCount === 0) {
      showToast(
        `Successfully imported ${newCount} new student${newCount !== 1 ? "s" : ""} and updated ${updatedCount} returning student${updatedCount !== 1 ? "s" : ""}!`,
        "success",
      );
      // Refresh page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } else {
      // Infrastructure errors - show what succeeded and what failed
      const parts: string[] = [];
      if (newCount > 0) parts.push(`${newCount} new`);
      if (updatedCount > 0) parts.push(`${updatedCount} updated`);
      if (failedCount > 0) parts.push(`${failedCount} failed`);

      showToast(`Import completed with errors: ${parts.join(", ")}. Click to view errors.`, "error");

      // Show error modal
      setShowErrorModal(true);
    }
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

      {/* Error Report Modal */}
      <ErrorReportModal
        open={showErrorModal}
        errors={importErrors}
        onClose={() => {
          setShowErrorModal(false);
          // Refresh page after closing error modal
          setTimeout(() => {
            window.location.reload();
          }, 500);
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
