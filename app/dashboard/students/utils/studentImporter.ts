// studentImporter.ts
"use server";

import type { TablesInsert, TablesUpdate } from "@/lib/schema";
import { createServerSupabaseClient } from "@/lib/server-utils";
import { getChangedFields, type StudentData } from "./csvMapper";

export interface ImportResult {
  success: boolean;
  newCount: number;
  updatedCount: number;
  skippedCount: number;
  failedCount: number;
  errors: ErrorDetail[];
  nameMismatches?: NameMismatch[];
  details?: unknown;
}

export interface ErrorDetail {
  rowNumber: number;
  studentName: string;
  studentCode?: string;
  errorType: string;
  message: string;
  originalRow?: Record<string, unknown>;
}

export interface NameMismatch {
  studentCode: string;
  dbFirstName: string;
  dbLastName: string;
  csvFirstName: string;
  csvLastName: string;
  csvRow: StudentData;
  rowNumber: number;
}

export interface NameMismatchDecision {
  studentCode: string;
  action: "approve" | "skip" | "edit";
  editedFirstName?: string;
  editedLastName?: string;
}

// Import students to Supabase database (for new students only)
export async function importNewStudents(students: TablesInsert<"students">[], rowOffset = 0): Promise<ImportResult> {
  const result: ImportResult = {
    success: true,
    newCount: 0,
    updatedCount: 0,
    skippedCount: 0,
    failedCount: 0,
    errors: [],
  };

  try {
    // Validate input
    if ((students ?? []).length === 0) {
      return result;
    }

    const supabase = createServerSupabaseClient();

    // Step 1: Check for existing students (duplicate detection)
    const studentsWithRowNumbers = students.map((student, index) => ({
      student,
      rowNumber: rowOffset + index + 1,
    }));

    let existingStudentsMap: Map<string, Record<string, unknown>>;
    try {
      existingStudentsMap = await lookupExistingStudents(studentsWithRowNumbers);
    } catch (error) {
      // If lookup fails, log error but continue with import (will catch duplicates at insert time)
      result.errors.push({
        rowNumber: 0,
        studentName: "Duplicate check",
        errorType: "LOOKUP_FAILED",
        message: `Failed to check for duplicates: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
      existingStudentsMap = new Map();
    }

    // Step 2: Filter out duplicates
    const studentsToInsert: { student: TablesInsert<"students">; rowNumber: number }[] = [];
    const duplicateErrors: ErrorDetail[] = [];

    for (const { student, rowNumber } of studentsWithRowNumbers) {
      const email = typeof student.email === "string" ? student.email.toLowerCase().trim() : undefined;
      const firstName =
        typeof student.legal_first_name === "string" ? student.legal_first_name.trim().toLowerCase() : "";
      const lastName = typeof student.legal_last_name === "string" ? student.legal_last_name.trim().toLowerCase() : "";
      const firstNameDisplay = typeof student.legal_first_name === "string" ? student.legal_first_name : "";
      const lastNameDisplay = typeof student.legal_last_name === "string" ? student.legal_last_name : "";
      const studentName = `${firstNameDisplay} ${lastNameDisplay}`.trim() || "Unknown";

      // Check if student already exists
      let isDuplicate = false;
      let existingStudent: Record<string, unknown> | undefined;

      // First check by email (primary check)
      if (email && existingStudentsMap.has(email)) {
        isDuplicate = true;
        existingStudent = existingStudentsMap.get(email);
      } else if (firstName && lastName) {
        // Check by name as fallback (for students without email or with email typos)
        // Look through the map for matching names
        for (const existing of existingStudentsMap.values()) {
          const existingFirstName = ((existing.legal_first_name as string)?.trim() ?? "").toLowerCase();
          const existingLastName = ((existing.legal_last_name as string)?.trim() ?? "").toLowerCase();
          if (existingFirstName === firstName && existingLastName === lastName) {
            isDuplicate = true;
            existingStudent = existing;
            break;
          }
        }
      }

      if (isDuplicate && existingStudent) {
        const existingStudentCode = existingStudent.student_code as string | undefined;
        const existingEmail = existingStudent.email as string | undefined;
        duplicateErrors.push({
          rowNumber,
          studentName,
          studentCode: existingStudentCode,
          errorType: "DUPLICATE_STUDENT",
          message: `Student already exists in database${existingStudentCode ? ` (${existingStudentCode})` : ""}${existingEmail ? ` - Email: ${existingEmail}` : ""}`,
          originalRow: student as Record<string, unknown>,
        });
        result.skippedCount++;
      } else {
        studentsToInsert.push({ student, rowNumber });
      }
    }

    // Add duplicate errors to result
    result.errors.push(...duplicateErrors);

    // Step 3: Insert only non-duplicate students
    if (studentsToInsert.length === 0) {
      return result;
    }

    // Remove is_returning field if present (not stored in DB)
    const cleanedStudents = studentsToInsert.map(({ student }) => {
      const studentRecord = student as Record<string, unknown>;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { is_returning, ...rest } = studentRecord;
      return rest as TablesInsert<"students">;
    });

    // Insert students into database
    const { data, error } = await supabase.from("students").insert(cleanedStudents).select();

    if (error) {
      result.success = false;
      result.failedCount = studentsToInsert.length;
      // Map insert errors to specific rows
      for (const { rowNumber, student } of studentsToInsert) {
        const studentName = `${student.legal_first_name ?? ""} ${student.legal_last_name ?? ""}`.trim() || "Unknown";
        result.errors.push({
          rowNumber,
          studentName,
          errorType: "INSERT_FAILED",
          message: error.message,
          originalRow: student as Record<string, unknown>,
        });
      }
      return result;
    }

    result.newCount = data?.length ?? studentsToInsert.length;
    return result;
  } catch (error) {
    result.success = false;
    result.failedCount = students.length;
    result.errors.push({
      rowNumber: 0,
      studentName: "Batch import",
      errorType: "UNKNOWN_ERROR",
      message: error instanceof Error ? error.message : "Unknown error occurred",
    });
    return result;
  }
}

// Legacy function for backward compatibility
export async function importStudentsToSupabase(students: TablesInsert<"students">[]): Promise<ImportResult> {
  return importNewStudents(students);
}

// Lookup existing students by email and name (for duplicate detection)
export async function lookupExistingStudents(
  students: { student: TablesInsert<"students">; rowNumber: number }[],
): Promise<Map<string, Record<string, unknown>>> {
  const studentMap = new Map<string, Record<string, unknown>>();

  if (students.length === 0) {
    return studentMap;
  }

  const supabase = createServerSupabaseClient();

  // Collect all emails
  const emails = students
    .map((s) => s.student.email)
    .filter((email): email is string => typeof email === "string" && email.length > 0)
    .map((email) => email.toLowerCase().trim());

  // Query by email (primary check)
  if (emails.length > 0) {
    const { data, error } = await supabase.from("students").select("*").in("email", emails);

    if (error) {
      throw new Error(`Failed to lookup existing students by email: ${error.message}`);
    }

    // Build map of email -> student record
    if (data) {
      for (const student of data) {
        if (student.email) {
          const normalizedEmail = student.email.toLowerCase().trim();
          studentMap.set(normalizedEmail, student as Record<string, unknown>);
        }
      }
    }
  }

  // Also check by first name + last name as secondary check for students without email or with email typos
  // This is a fallback to catch duplicates even if email doesn't match
  const nameCombinations = students
    .map((s) => {
      const firstName = typeof s.student.legal_first_name === "string" ? s.student.legal_first_name.trim() : "";
      const lastName = typeof s.student.legal_last_name === "string" ? s.student.legal_last_name.trim() : "";
      return {
        firstName: firstName.toLowerCase(),
        lastName: lastName.toLowerCase(),
        csvStudent: s.student,
      };
    })
    .filter((n) => n.firstName && n.lastName);

  if (nameCombinations.length > 0) {
    // Query all students and check name matches
    // Note: This is less efficient but necessary for name matching
    // We could optimize this with a more complex query, but for now this works
    const { data: allStudents, error: nameError } = await supabase
      .from("students")
      .select("legal_first_name, legal_last_name, email, student_code, *");

    if (!nameError && allStudents) {
      for (const nameCombo of nameCombinations) {
        const csvEmail =
          typeof nameCombo.csvStudent.email === "string" ? nameCombo.csvStudent.email.toLowerCase().trim() : undefined;
        // If we already found by email, skip name check
        if (csvEmail && studentMap.has(csvEmail)) continue;

        // Check if name matches any existing student
        const existingStudent = allStudents.find((dbStudent) => {
          const dbFirstName =
            typeof dbStudent.legal_first_name === "string" ? dbStudent.legal_first_name.trim().toLowerCase() : "";
          const dbLastName =
            typeof dbStudent.legal_last_name === "string" ? dbStudent.legal_last_name.trim().toLowerCase() : "";
          return dbFirstName === nameCombo.firstName && dbLastName === nameCombo.lastName;
        });

        if (existingStudent) {
          // Use email as key if available, otherwise use name combination
          const existingEmail =
            typeof existingStudent.email === "string" ? existingStudent.email.toLowerCase().trim() : "";
          const key = existingEmail || `${nameCombo.firstName}|${nameCombo.lastName}`;
          if (!studentMap.has(key)) {
            studentMap.set(key, existingStudent as Record<string, unknown>);
          }
        }
      }
    }
  }

  return studentMap;
}

// Lookup returning students by student_code (batch query)
export async function lookupReturningStudents(studentCodes: string[]): Promise<Map<string, Record<string, unknown>>> {
  const studentMap = new Map<string, Record<string, unknown>>();

  if (studentCodes.length === 0) {
    return studentMap;
  }

  const supabase = createServerSupabaseClient();

  // Batch query all students at once
  const { data, error } = await supabase.from("students").select("*").in("student_code", studentCodes);

  if (error) {
    throw new Error(`Failed to lookup returning students: ${error.message}`);
  }

  // Build map of student_code -> student record
  if (data) {
    for (const student of data) {
      if (student.student_code) {
        studentMap.set(student.student_code, student as Record<string, unknown>);
      }
    }
  }

  return studentMap;
}

// Update returning students
export async function updateReturningStudents(
  returningStudents: StudentData[],
  dbStudents: Map<string, Record<string, unknown>>,
  nameMismatchDecisions?: Map<string, NameMismatchDecision>,
  rowOffset = 0,
): Promise<ImportResult> {
  const result: ImportResult = {
    success: true,
    newCount: 0,
    updatedCount: 0,
    skippedCount: 0,
    failedCount: 0,
    errors: [],
  };

  if (returningStudents.length === 0) {
    return result;
  }

  try {
    const supabase = createServerSupabaseClient();

    for (let i = 0; i < returningStudents.length; i++) {
      const csvStudent = returningStudents[i];
      if (!csvStudent) continue;
      const studentCode = csvStudent.student_code as string | undefined;
      const rowNumber = rowOffset + i + 1;

      if (!studentCode) {
        const firstName = typeof csvStudent.legal_first_name === "string" ? csvStudent.legal_first_name : "";
        const lastName = typeof csvStudent.legal_last_name === "string" ? csvStudent.legal_last_name : "";
        const studentName = `${firstName} ${lastName}`.trim() || "Unknown";
        result.errors.push({
          rowNumber,
          studentName,
          errorType: "MISSING_STUDENT_CODE",
          message: "Missing student_code in CSV data",
          originalRow: csvStudent,
        });
        result.failedCount++;
        continue;
      }

      const dbStudent = dbStudents.get(studentCode);
      if (!dbStudent) {
        const firstName = typeof csvStudent.legal_first_name === "string" ? csvStudent.legal_first_name : "";
        const lastName = typeof csvStudent.legal_last_name === "string" ? csvStudent.legal_last_name : "";
        const studentName = `${firstName} ${lastName}`.trim() || "Unknown";
        result.errors.push({
          rowNumber,
          studentName,
          studentCode,
          errorType: "STUDENT_CODE_NOT_FOUND",
          message: `Student with code ${studentCode} not found in database`,
          originalRow: csvStudent,
        });
        result.failedCount++;
        continue;
      }

      // Check for name mismatch
      const csvFirstName = (csvStudent.legal_first_name as string)?.trim() ?? "";
      const csvLastName = (csvStudent.legal_last_name as string)?.trim() ?? "";
      const dbFirstName = (dbStudent.legal_first_name as string)?.trim() ?? "";
      const dbLastName = (dbStudent.legal_last_name as string)?.trim() ?? "";

      const nameMismatch =
        csvFirstName.toLowerCase() !== dbFirstName.toLowerCase() ||
        csvLastName.toLowerCase() !== dbLastName.toLowerCase();

      if (nameMismatch) {
        const decision = nameMismatchDecisions?.get(studentCode);
        if (!decision || decision.action === "skip") {
          result.errors.push({
            rowNumber,
            studentName: `${csvFirstName} ${csvLastName}`.trim() || "Unknown",
            studentCode,
            errorType: "NAME_MISMATCH_SKIPPED",
            message: `Name mismatch: DB has "${dbFirstName} ${dbLastName}", CSV has "${csvFirstName} ${csvLastName}". Update skipped.`,
            originalRow: csvStudent,
          });
          result.skippedCount++;
          continue;
        }

        // If approved or edited, include name in update
        if (decision.action === "edit" && decision.editedFirstName && decision.editedLastName) {
          csvStudent.legal_first_name = decision.editedFirstName;
          csvStudent.legal_last_name = decision.editedLastName;
        }
        // If approved, use CSV names as-is
      }

      // Get changed fields (excluding name if not approved)
      const changes = getChangedFields(dbStudent, csvStudent) as Partial<TablesUpdate<"students">>;

      // If no changes, skip update
      if (Object.keys(changes).length === 0) {
        result.updatedCount++; // Count as success (no changes needed)
        continue;
      }

      // Add updated_at timestamp
      changes.updated_at = new Date().toISOString();

      // Update student in database
      const { error } = await supabase.from("students").update(changes).eq("student_code", studentCode);

      if (error) {
        result.errors.push({
          rowNumber,
          studentName: `${csvFirstName} ${csvLastName}`.trim() || "Unknown",
          studentCode,
          errorType: "UPDATE_FAILED",
          message: error.message,
          originalRow: csvStudent,
        });
        result.failedCount++;
        result.success = false;
      } else {
        result.updatedCount++;
      }
    }

    return result;
  } catch (error) {
    result.success = false;
    result.failedCount = returningStudents.length;
    result.errors.push({
      rowNumber: 0,
      studentName: "Batch update",
      errorType: "UNKNOWN_ERROR",
      message: error instanceof Error ? error.message : "Unknown error occurred",
    });
    return result;
  }
}

// Import students in batches (for large CSV files) - legacy function
export async function importStudentsInBatches(
  students: TablesInsert<"students">[],
  batchSize = 100,
): Promise<ImportResult> {
  const result: ImportResult = {
    success: true,
    newCount: 0,
    updatedCount: 0,
    skippedCount: 0,
    failedCount: 0,
    errors: [],
  };

  try {
    const supabase = createServerSupabaseClient();
    const errors: string[] = [];

    // Process in batches
    for (let i = 0; i < students.length; i += batchSize) {
      const batch = students.slice(i, i + batchSize);

      // Remove is_returning field if present
      const cleanedBatch = batch.map((student) => {
        const studentRecord = student as Record<string, unknown>;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { is_returning, ...rest } = studentRecord;
        return rest as TablesInsert<"students">;
      });

      const { data, error } = await supabase.from("students").insert(cleanedBatch).select();

      if (error) {
        errors.push(`Batch ${i / batchSize + 1}: ${error.message}`);
        result.failedCount += batch.length;
        result.success = false;
      } else {
        result.newCount += data?.length ?? 0;
      }
    }

    if (errors.length > 0) {
      result.errors.push({
        rowNumber: 0,
        studentName: "Batch import",
        errorType: "BATCH_ERROR",
        message: `Some batches failed: ${errors.join(", ")}`,
      });
    }

    return result;
  } catch (error) {
    result.success = false;
    result.failedCount = students.length;
    result.errors.push({
      rowNumber: 0,
      studentName: "Batch import",
      errorType: "UNKNOWN_ERROR",
      message: error instanceof Error ? error.message : "Unknown error occurred",
    });
    return result;
  }
}
