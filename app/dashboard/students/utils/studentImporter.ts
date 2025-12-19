// studentImporter.ts
"use server";

import type { TablesInsert, TablesUpdate } from "@/lib/schema";
import { createServerSupabaseClient } from "@/lib/server-utils";
import { getChangedFields, type StudentData } from "./csvMapper";

export interface ImportResult {
  success: boolean;
  newCount: number;
  updatedCount: number;
  failedCount: number;
  errors: ErrorDetail[];
}

export interface ErrorDetail {
  rowNumber: number;
  studentName: string;
  studentCode?: string;
  errorType: string;
  message: string;
  originalRow?: Record<string, unknown>;
}

// PHASE 1: VALIDATION FUNCTIONS - Before any database writes

export interface ValidationResult {
  isValid: boolean;
  errors: ErrorDetail[];
}

/**
 - Extract normalized student name components from student data
 */
function getStudentName(student: StudentData | Record<string, unknown>): {
  firstName: string;
  lastName: string;
  firstNameDisplay: string;
  lastNameDisplay: string;
  studentName: string;
} {
  const firstName = typeof student.legal_first_name === "string" ? student.legal_first_name.trim() : "";
  const lastName = typeof student.legal_last_name === "string" ? student.legal_last_name.trim() : "";
  const firstNameDisplay = typeof student.legal_first_name === "string" ? student.legal_first_name : "";
  const lastNameDisplay = typeof student.legal_last_name === "string" ? student.legal_last_name : "";
  const studentName = `${firstNameDisplay} ${lastNameDisplay}`.trim() || "Unknown";
  return {
    firstName: firstName.toLowerCase(),
    lastName: lastName.toLowerCase(),
    firstNameDisplay,
    lastNameDisplay,
    studentName,
  };
}

/**
 - Create an error detail object
 */
function createError(
  rowNumber: number,
  studentName: string,
  errorType: string,
  message: string,
  studentCode?: string,
  originalRow?: Record<string, unknown>,
): ErrorDetail {
  return {
    rowNumber,
    studentName,
    studentCode,
    errorType,
    message,
    originalRow,
  };
}

/**
 - Check for duplicates within CSV by email and name
 */
function findCSVDuplicates(
  students: StudentData[],
  rowOffset: number,
): { emailDuplicates: ErrorDetail[]; nameDuplicates: ErrorDetail[] } {
  const emailMap = new Map<string, number[]>();
  const nameMap = new Map<string, number[]>();
  const emailDuplicates: ErrorDetail[] = [];
  const nameDuplicates: ErrorDetail[] = [];

  // Build maps
  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    if (!student) continue;
    const rowNumber = rowOffset + i + 1;

    const email = typeof student.email === "string" ? student.email.toLowerCase().trim() : "";
    const { firstName, lastName } = getStudentName(student);
    const nameKey = `${firstName}|${lastName}`;

    if (email) {
      if (!emailMap.has(email)) emailMap.set(email, []);
      emailMap.get(email)?.push(rowNumber);
    }

    if (firstName && lastName) {
      if (!nameMap.has(nameKey)) nameMap.set(nameKey, []);
      nameMap.get(nameKey)?.push(rowNumber);
    }
  }

  // Report email duplicates
  for (const [email, rowNumbers] of emailMap.entries()) {
    if (rowNumbers.length > 1) {
      const firstRow = students[rowNumbers[0]! - rowOffset - 1];
      const { studentName } = getStudentName(firstRow ?? {});
      const studentCode = firstRow?.student_code as string | undefined;
      emailDuplicates.push(
        createError(
          rowNumbers[0]!,
          studentName,
          "DUPLICATE_IN_CSV",
          `Duplicate email found in CSV\nEmail: ${email}\nRows: ${rowNumbers.join(", ")}`,
          studentCode,
          firstRow,
        ),
      );
    }
  }

  // Report name duplicates
  for (const [nameKey, rowNumbers] of nameMap.entries()) {
    if (rowNumbers.length > 1) {
      const [firstName, lastName] = nameKey.split("|");
      const firstRow = students[rowNumbers[0]! - rowOffset - 1];
      const studentCode = firstRow?.student_code as string | undefined;
      nameDuplicates.push(
        createError(
          rowNumbers[0]!,
          `${firstName} ${lastName}`,
          "DUPLICATE_IN_CSV",
          `Duplicate name found in CSV\nName: ${firstName} ${lastName}\nRows: ${rowNumbers.join(", ")}`,
          studentCode,
          firstRow,
        ),
      );
    }
  }

  return { emailDuplicates, nameDuplicates };
}

/**
 - Check if student is duplicate against database by email OR name
 */
function checkDuplicateAgainstDB(
  student: StudentData,
  existingStudentsMap: Map<string, Record<string, unknown>>,
): { isDuplicate: boolean; existingStudent?: Record<string, unknown> } {
  const email = typeof student.email === "string" ? student.email.toLowerCase().trim() : "";
  const { firstName, lastName } = getStudentName(student);

  // Check by email first - acts as primary check
  if (email && existingStudentsMap.has(email)) {
    return { isDuplicate: true, existingStudent: existingStudentsMap.get(email) };
  }

  // Check by name if email not found or missing
  if (firstName && lastName) {
    for (const existing of existingStudentsMap.values()) {
      const existingFirstName = ((existing.legal_first_name as string)?.trim() ?? "").toLowerCase();
      const existingLastName = ((existing.legal_last_name as string)?.trim() ?? "").toLowerCase();
      if (existingFirstName === firstName && existingLastName === lastName) {
        return { isDuplicate: true, existingStudent: existing };
      }
    }
  }

  return { isDuplicate: false };
}

/**
 - Validate all new students before import
 - Checks: required fields, email format, duplicates whether email OR name against DB and duplicates within CSV
 */
export async function validateNewStudents(students: StudentData[], rowOffset = 0): Promise<ValidationResult> {
  const errors: ErrorDetail[] = [];

  if (students.length === 0) {
    return { isValid: true, errors: [] };
  }

  // Step 1: Validate required fields and email format
  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    if (!student) continue;
    const rowNumber = rowOffset + i + 1;
    const { studentName } = getStudentName(student);
    const email = typeof student.email === "string" ? student.email.trim() : "";

    if (!email) {
      const studentCode = student.student_code as string | undefined;
      errors.push(
        createError(
          rowNumber,
          studentName,
          "MISSING_EMAIL",
          "Email is required for new students",
          studentCode,
          student,
        ),
      );
      continue;
    }

    const { firstName, lastName } = getStudentName(student);
    if (!firstName && !lastName) {
      const studentCode = student.student_code as string | undefined;
      errors.push(
        createError(rowNumber, "Unknown", "MISSING_NAME", "First name or last name is required", studentCode, student),
      );
      continue;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      const studentCode = student.student_code as string | undefined;
      errors.push(
        createError(
          rowNumber,
          studentName,
          "INVALID_EMAIL",
          `Invalid email format\nEmail: ${email}\nRow: ${rowNumber}`,
          studentCode,
          student,
        ),
      );
    }
  }

  // Step 2: Check for duplicates within CSV itself
  const { emailDuplicates, nameDuplicates } = findCSVDuplicates(students, rowOffset);
  errors.push(...emailDuplicates, ...nameDuplicates);

  // Step 3: Check for duplicates against database
  if (errors.length === 0) {
    try {
      const existingStudentsMap = await lookupExistingStudents(
        students.map((student, index) => ({
          student: student as TablesInsert<"students">,
          rowNumber: rowOffset + index + 1,
        })),
      );

      for (let i = 0; i < students.length; i++) {
        const student = students[i];
        if (!student) continue;
        const rowNumber = rowOffset + i + 1;
        const { studentName } = getStudentName(student);

        const { isDuplicate, existingStudent } = checkDuplicateAgainstDB(student, existingStudentsMap);

        if (isDuplicate && existingStudent) {
          const existingStudentCode = existingStudent.student_code as string | undefined;
          const existingEmail = existingStudent.email as string | undefined;
          let errorMessage = "Student already exists in database";
          if (existingStudentCode || existingEmail) {
            errorMessage += "\n";
            if (existingStudentCode) {
              errorMessage += `Code: ${existingStudentCode}`;
            }
            if (existingEmail) {
              if (existingStudentCode) errorMessage += "\n";
              errorMessage += `Email: ${existingEmail}`;
            }
          }
          errors.push(
            createError(rowNumber, studentName, "DUPLICATE_STUDENT", errorMessage, existingStudentCode, student),
          );
        }
      }
    } catch (error) {
      errors.push(
        createError(
          0,
          "Validation",
          "LOOKUP_FAILED",
          `Failed to check for duplicates: ${error instanceof Error ? error.message : "Unknown error"}`,
        ),
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 - Validate all returning students before import
 - Checks: has student_code, student_code exists in DB, name matches DB record, no duplicate student_codes in CSV
 */
export async function validateReturningStudents(students: StudentData[], rowOffset = 0): Promise<ValidationResult> {
  const errors: ErrorDetail[] = [];

  if (students.length === 0) {
    return { isValid: true, errors: [] };
  }

  // Step 1: Validate student_code presence and check for CSV duplicates
  const studentCodeMap = new Map<string, number[]>();

  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    if (!student) continue;
    const rowNumber = rowOffset + i + 1;
    const { studentName } = getStudentName(student);
    const studentCode = student.student_code as string | undefined;

    if (!studentCode) {
      errors.push(
        createError(
          rowNumber,
          studentName,
          "MISSING_STUDENT_CODE",
          "student_code is required for returning students",
          undefined,
          student,
        ),
      );
      continue;
    }

    if (!studentCodeMap.has(studentCode)) {
      studentCodeMap.set(studentCode, []);
    }
    studentCodeMap.get(studentCode)?.push(rowNumber);
  }

  // Report CSV duplicates
  for (const [studentCode, rowNumbers] of studentCodeMap.entries()) {
    if (rowNumbers.length > 1) {
      const firstRow = students[rowNumbers[0]! - rowOffset - 1];
      const { studentName } = getStudentName(firstRow ?? {});
      errors.push(
        createError(
          rowNumbers[0]!,
          studentName,
          "DUPLICATE_IN_CSV",
          `Duplicate student code found in CSV\nCode: ${studentCode}\nRows: ${rowNumbers.join(", ")}`,
          studentCode,
          firstRow,
        ),
      );
    }
  }

  // Step 2: Lookup all student_codes in database
  const studentCodes = Array.from(studentCodeMap.keys());
  if (studentCodes.length === 0) {
    return { isValid: errors.length === 0, errors };
  }

  let dbStudents: Map<string, Record<string, unknown>>;
  try {
    dbStudents = await lookupReturningStudents(studentCodes);
  } catch (error) {
    errors.push({
      rowNumber: 0,
      studentName: "Validation",
      errorType: "LOOKUP_FAILED",
      message: `Failed to lookup returning students: ${error instanceof Error ? error.message : "Unknown error"}`,
    });
    return { isValid: false, errors };
  }

  // Step 3: Validate each returning student
  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    if (!student) continue;
    const rowNumber = rowOffset + i + 1;

    const studentCode = student.student_code as string | undefined;
    if (!studentCode) continue;

    const dbStudent = dbStudents.get(studentCode);
    if (!dbStudent) {
      const { studentName } = getStudentName(student);
      errors.push(
        createError(
          rowNumber,
          studentName,
          "STUDENT_CODE_NOT_FOUND",
          `Student with code ${studentCode} not found in database`,
          studentCode,
          student,
        ),
      );
      continue;
    }

    // Check for name mismatch
    const { firstName: csvFirstName, lastName: csvLastName, studentName: csvStudentName } = getStudentName(student);
    const { firstName: dbFirstName, lastName: dbLastName } = getStudentName(dbStudent);

    if (csvFirstName !== dbFirstName || csvLastName !== dbLastName) {
      const dbFirstNameDisplay = (dbStudent.legal_first_name as string)?.trim() ?? "";
      const dbLastNameDisplay = (dbStudent.legal_last_name as string)?.trim() ?? "";
      const csvFirstNameDisplay = (student.legal_first_name as string)?.trim() ?? "";
      const csvLastNameDisplay = (student.legal_last_name as string)?.trim() ?? "";
      errors.push(
        createError(
          rowNumber,
          csvStudentName,
          "NAME_MISMATCH",
          `Name mismatch: Database has "${dbFirstNameDisplay} ${dbLastNameDisplay}", CSV has "${csvFirstNameDisplay} ${csvLastNameDisplay}". Please update the name manually in the student profile or correct the CSV.`,
          studentCode,
          student,
        ),
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// PHASE 2: DATABASE WRITE FUNCTIONS - Only called if validation passes
export async function importNewStudents(students: TablesInsert<"students">[], rowOffset = 0): Promise<ImportResult> {
  const result: ImportResult = {
    success: true,
    newCount: 0,
    updatedCount: 0,
    failedCount: 0,
    errors: [],
  };

  try {
    if ((students ?? []).length === 0) {
      return result;
    }

    const supabase = createServerSupabaseClient();

    // Remove is_returning field if present since it is not stored in DB
    const cleanedStudents = students.map((student) => {
      const studentRecord = student as Record<string, unknown>;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { is_returning, ...rest } = studentRecord;
      return rest as TablesInsert<"students">;
    });

    // Insert students into database
    const { data, error } = await supabase.from("students").insert(cleanedStudents).select();

    if (error) {
      // Infrastructure error - report but allow partial success
      result.success = false;
      result.failedCount = students.length;
      for (let i = 0; i < students.length; i++) {
        const student = students[i];
        if (!student) continue;
        const { studentName } = getStudentName(student);
        result.errors.push(
          createError(
            rowOffset + i + 1,
            studentName,
            "INSERT_FAILED",
            error.message,
            undefined,
            student as Record<string, unknown>,
          ),
        );
      }
      return result;
    }

    result.newCount = data?.length ?? students.length;
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

/**
 * Phase 2: Update returning students assuming validation already passed
 * Handles infrastructure errors well and allow for partial success
 */
export async function updateReturningStudents(
  returningStudents: StudentData[],
  dbStudents: Map<string, Record<string, unknown>>,
  rowOffset = 0,
): Promise<ImportResult> {
  const result: ImportResult = {
    success: true,
    newCount: 0,
    updatedCount: 0,
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
        // Should not happen if validation passed
        const { studentName } = getStudentName(csvStudent);
        result.errors.push(
          createError(
            rowNumber,
            studentName,
            "MISSING_STUDENT_CODE",
            "Missing student_code in CSV data",
            undefined,
            csvStudent,
          ),
        );
        result.failedCount++;
        continue;
      }

      const dbStudent = dbStudents.get(studentCode);
      if (!dbStudent) {
        // Should not happen if validation passed
        const { studentName } = getStudentName(csvStudent);
        result.errors.push(
          createError(
            rowNumber,
            studentName,
            "STUDENT_CODE_NOT_FOUND",
            `Student with code ${studentCode} not found in database`,
            studentCode,
            csvStudent,
          ),
        );
        result.failedCount++;
        continue;
      }

      // Get changed fields
      const changes = getChangedFields(dbStudent, csvStudent) as Partial<TablesUpdate<"students">>;

      // If no changes, skip update
      if (Object.keys(changes).length === 0) {
        result.updatedCount++;
        continue;
      }

      // Add updated_at timestamp
      changes.updated_at = new Date().toISOString();

      // Update student in database
      const { error } = await supabase.from("students").update(changes).eq("student_code", studentCode);

      if (error) {
        // Infrastructure error - report but continue with other updates, since this is usually rare
        const { studentName } = getStudentName(csvStudent);
        result.errors.push(
          createError(rowNumber, studentName, "UPDATE_FAILED", error.message, studentCode, csvStudent),
        );
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

// HELPER FUNCTIONS

/**
 * Lookup existing students by email and name. This is only CSV-based, and so it does efficient querying.
 * Queries only students from CSV, not entire database
 */
export async function lookupExistingStudents(
  students: { student: TablesInsert<"students">; rowNumber: number }[],
): Promise<Map<string, Record<string, unknown>>> {
  const studentMap = new Map<string, Record<string, unknown>>();

  if (students.length === 0) {
    return studentMap;
  }

  const supabase = createServerSupabaseClient();

  // Collect all emails from CSV
  const emails = students
    .map((s) => s.student.email)
    .filter((email): email is string => typeof email === "string" && email.length > 0)
    .map((email) => email.toLowerCase().trim());

  // Query by email as a primary check
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

  // Collect name combinations from CSV only for students not found by email
  const nameCombinations = students
    .map((s) => {
      const firstName = typeof s.student.legal_first_name === "string" ? s.student.legal_first_name.trim() : "";
      const lastName = typeof s.student.legal_last_name === "string" ? s.student.legal_last_name.trim() : "";
      const csvEmail = typeof s.student.email === "string" ? s.student.email.toLowerCase().trim() : undefined;
      return {
        firstName: firstName.toLowerCase(),
        lastName: lastName.toLowerCase(),
        csvEmail,
        csvStudent: s.student,
      };
    })
    .filter((n) => n.firstName && n.lastName && (!n.csvEmail || !studentMap.has(n.csvEmail))); // Only check names if email not found

  if (nameCombinations.length > 0) {
    // Collect unique first and last names from CSV
    const uniqueFirstNames = Array.from(new Set(nameCombinations.map((n) => n.firstName)));
    const uniqueLastNames = Array.from(new Set(nameCombinations.map((n) => n.lastName)));

    // Query students where first_name OR last_name matches CSV names
    // Then filter in memory for exact matches
    const { data: nameMatches, error: nameError } = await supabase
      .from("students")
      .select("*")
      .in("legal_first_name", uniqueFirstNames)
      .in("legal_last_name", uniqueLastNames);

    if (!nameError && nameMatches) {
      // Build a map of name combinations for quick lookup
      const nameMap = new Map<string, Record<string, unknown>>();
      for (const dbStudent of nameMatches) {
        const dbFirstName = (
          typeof dbStudent.legal_first_name === "string" ? dbStudent.legal_first_name.trim() : ""
        ).toLowerCase();
        const dbLastName = (
          typeof dbStudent.legal_last_name === "string" ? dbStudent.legal_last_name.trim() : ""
        ).toLowerCase();
        const nameKey = `${dbFirstName}|${dbLastName}`;
        if (!nameMap.has(nameKey)) {
          nameMap.set(nameKey, dbStudent as Record<string, unknown>);
        }
      }

      // Match CSV names to database names
      for (const nameCombo of nameCombinations) {
        const nameKey = `${nameCombo.firstName}|${nameCombo.lastName}`;
        const existingStudent = nameMap.get(nameKey);

        if (existingStudent) {
          // Use email as key if available, otherwise use name combination
          const existingEmail =
            typeof existingStudent.email === "string" ? existingStudent.email.toLowerCase().trim() : "";
          const key = existingEmail || nameKey;
          if (!studentMap.has(key)) {
            studentMap.set(key, existingStudent);
          }
        }
      }
    }
  }

  return studentMap;
}

/**
 * Lookup returning students by student_code
 */
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
