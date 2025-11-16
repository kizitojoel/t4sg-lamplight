"use client";

import type { Constants } from "@/lib/schema";
import Papa from "papaparse";
import { useState } from "react";
import {
  convertToNameMismatches,
  detectNameMismatches,
  isValidStudent,
  mapCSVRowToStudent,
  splitStudentsByReturningStatus,
  type CSVRow,
  type StudentData,
} from "../utils/csvMapper";
import {
  importNewStudents,
  lookupReturningStudents,
  updateReturningStudents,
  type NameMismatch,
  type NameMismatchDecision,
} from "../utils/studentImporter";
import { ErrorReportModal, type ErrorInfo } from "./ErrorReportModal";
import { LoadingOverlay } from "./LoadingOverlay";
import { NameMismatchConfirmationModal } from "./NameMismatchConfirmationModal";
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
  const [showNameMismatchModal, setShowNameMismatchModal] = useState(false);
  const [nameMismatches, setNameMismatches] = useState<NameMismatch[]>([]);
  const [pendingReturningStudents, setPendingReturningStudents] = useState<StudentData[]>([]);
  const [pendingDbStudents, setPendingDbStudents] = useState<Map<string, Record<string, unknown>>>(new Map());
  const [pendingRowOffset, setPendingRowOffset] = useState(0);
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
              (student): StudentData => ({
                ...student,
                program,
                course_placement: coursePlacement,
              }),
            );

            // Step 3: Validate students
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
            const allErrors: {
              rowNumber: number;
              studentName: string;
              error: string;
              errorType?: string;
              studentCode?: string;
            }[] = [];
            for (let i = 0; i < splitResult.invalidStudents.length; i++) {
              const invalid = splitResult.invalidStudents[i];
              if (!invalid) continue;
              const firstName =
                typeof invalid.student.legal_first_name === "string" ? invalid.student.legal_first_name : "";
              const lastName =
                typeof invalid.student.legal_last_name === "string" ? invalid.student.legal_last_name : "";
              const studentName = `${firstName} ${lastName}`.trim() || "Unknown";
              allErrors.push({
                rowNumber: i + 1,
                studentName,
                error: invalid.error,
                errorType: "VALIDATION_ERROR",
              });
            }

            // Step 5: Import new students
            let newStudentResult = { newCount: 0, skippedCount: 0 };
            if (splitResult.newStudents.length > 0) {
              setImportMessage(
                `Importing ${splitResult.newStudents.length} new student${splitResult.newStudents.length !== 1 ? "s" : ""}...`,
              );
              await sleep(300);

              // Calculate row offset: invalid students come first, then new students
              const rowOffset = splitResult.invalidStudents.length;

              const newResult = await importNewStudents(
                splitResult.newStudents as Parameters<typeof importNewStudents>[0],
                rowOffset,
              );

              newStudentResult = {
                newCount: newResult.newCount,
                skippedCount: newResult.skippedCount,
              };

              // Add all errors from import including duplicates
              if (newResult.errors.length > 0) {
                allErrors.push(
                  ...newResult.errors.map((e) => ({
                    rowNumber: e.rowNumber,
                    studentName: e.studentName,
                    studentCode: e.studentCode,
                    error: e.message,
                    errorType: e.errorType,
                  })),
                );
              }
            }

            // Step 6: Process returning students
            let returningUpdateResult = { updatedCount: 0, skippedCount: 0 };
            if (splitResult.returningStudents.length > 0) {
              setImportMessage(
                `Processing ${splitResult.returningStudents.length} returning student${splitResult.returningStudents.length !== 1 ? "s" : ""}...`,
              );
              await sleep(300);

              // Lookup all returning students
              const studentCodes = splitResult.returningStudents
                .map((s) => s.student_code as string)
                .filter((code): code is string => Boolean(code));

              let dbStudents: Map<string, Record<string, unknown>>;
              try {
                dbStudents = await lookupReturningStudents(studentCodes);
              } catch (error) {
                // If lookup fails, add error for all returning students
                const errorMessage = error instanceof Error ? error.message : "Failed to lookup returning students";
                for (let i = 0; i < splitResult.returningStudents.length; i++) {
                  const student = splitResult.returningStudents[i];
                  if (!student) continue;
                  const firstName = typeof student.legal_first_name === "string" ? student.legal_first_name : "";
                  const lastName = typeof student.legal_last_name === "string" ? student.legal_last_name : "";
                  const studentName = `${firstName} ${lastName}`.trim() || "Unknown";
                  allErrors.push({
                    rowNumber: validStudents.length - splitResult.returningStudents.length + i + 1,
                    studentName,
                    error: errorMessage,
                    errorType: "LOOKUP_FAILED",
                    studentCode: student.student_code as string | undefined,
                  });
                }
                // Continue with import - new students can still be processed
                dbStudents = new Map();
              }

              // Detect name mismatches
              const mismatchesRaw = detectNameMismatches(
                splitResult.returningStudents,
                dbStudents,
                validStudents.length - splitResult.returningStudents.length,
              );
              const mismatches = convertToNameMismatches(mismatchesRaw);

              // Split returning students into good and pending
              const goodReturningStudents: StudentData[] = [];
              const pendingReturningStudents: StudentData[] = [];
              const mismatchCodes = new Set(mismatches.map((m) => m.studentCode));

              for (const student of splitResult.returningStudents) {
                const studentCode = student.student_code as string;
                if (mismatchCodes.has(studentCode)) {
                  pendingReturningStudents.push(student);
                } else {
                  goodReturningStudents.push(student);
                }
              }

              // Step 7: Process good returning students - with no name mismatches
              if (goodReturningStudents.length > 0) {
                setImportMessage(
                  `Updating ${goodReturningStudents.length} returning student${goodReturningStudents.length !== 1 ? "s" : ""}...`,
                );
                await sleep(300);

                const updateResult = await updateReturningStudents(
                  goodReturningStudents,
                  dbStudents,
                  undefined,
                  validStudents.length - splitResult.returningStudents.length,
                );

                returningUpdateResult = {
                  updatedCount: updateResult.updatedCount,
                  skippedCount: updateResult.skippedCount,
                };

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

              // Step 8: Handle name mismatches
              if (mismatches.length > 0) {
                // Store pending data for after modal confirmation
                setPendingReturningStudents(pendingReturningStudents);
                setPendingDbStudents(dbStudents);
                setPendingRowOffset(
                  validStudents.length - splitResult.returningStudents.length + goodReturningStudents.length,
                );
                setNameMismatches(mismatches);
                setShowNameMismatchModal(true);
                setIsImporting(false); // Pause import while waiting for admin decision
                return; // Exit early, will continue after modal confirmation
              }
            }

            // Step 9: Show final results if we have no name mismatches
            setIsImporting(false);
            showFinalResults(
              allErrors,
              newStudentResult.newCount,
              splitResult.returningStudents.length,
              returningUpdateResult.updatedCount,
              newStudentResult.skippedCount + returningUpdateResult.skippedCount,
            );
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

  const handleNameMismatchConfirm = async (decisions: Map<string, NameMismatchDecision>) => {
    setShowNameMismatchModal(false);
    setIsImporting(true);
    setImportMessage("Processing name mismatch decisions...");

    await sleep(300);

    // Process pending returning students with admin decisions
    const updateResult = await updateReturningStudents(
      pendingReturningStudents,
      pendingDbStudents,
      decisions,
      pendingRowOffset,
    );

    setIsImporting(false);

    // Collect all results
    const allErrors: {
      rowNumber: number;
      studentName: string;
      error: string;
      studentCode?: string;
      errorType?: string;
    }[] = [];
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

    // Show final results
    const newCount = pendingReturningStudents.length === 0 ? 0 : 0; // New students already processed
    const returningCount = pendingReturningStudents.length;
    showFinalResults(allErrors, newCount, returningCount, updateResult.updatedCount, updateResult.skippedCount);
  };

  const handleNameMismatchCancel = () => {
    setShowNameMismatchModal(false);
    setIsImporting(false);
    showToast("Import cancelled by user", "error");
  };

  const showFinalResults = (
    errors: { rowNumber: number; studentName: string; error: string; studentCode?: string; errorType?: string }[],
    newCount: number,
    returningCount: number,
    updatedCount = 0,
    skippedCount = 0,
  ) => {
    const failedCount = errors.length;

    // Store errors for modal
    if (failedCount > 0) {
      setImportErrors(
        errors.map((e) => ({
          rowNumber: e.rowNumber,
          studentName: e.studentName,
          studentCode: e.studentCode,
          error: e.error,
          errorType: e.errorType,
        })),
      );
    }

    if (failedCount === 0 && skippedCount === 0) {
      showToast(
        `Successfully imported ${newCount} new student${newCount !== 1 ? "s" : ""} and updated ${updatedCount} returning student${updatedCount !== 1 ? "s" : ""}!`,
        "success",
      );
      // Refresh page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } else {
      const parts: string[] = [];
      if (newCount > 0) parts.push(`${newCount} new`);
      if (updatedCount > 0) parts.push(`${updatedCount} updated`);
      if (skippedCount > 0) parts.push(`${skippedCount} skipped`);
      if (failedCount > 0) parts.push(`${failedCount} failed`);

      showToast(
        `Import completed: ${parts.join(", ")}. ${failedCount > 0 ? "Click to view errors." : ""}`,
        failedCount > 0 ? "error" : "success",
      );

      // Show error modal if there are errors
      if (failedCount > 0) {
        setShowErrorModal(true);
      } else {
        // Refresh page after a short delay if no errors
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
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

      {/* Name Mismatch Confirmation Modal */}
      <NameMismatchConfirmationModal
        open={showNameMismatchModal}
        mismatches={nameMismatches}
        onConfirm={(decisions) => {
          void handleNameMismatchConfirm(decisions);
        }}
        onCancel={handleNameMismatchCancel}
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
