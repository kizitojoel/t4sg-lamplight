import { Constants } from "@/lib/schema";

// Map CSV headers to database column names for ESOL program
const ESOL_COLUMN_MAPPING: Record<string, string> = {
  // Basic Info
  "First Name": "legal_first_name",
  "Last Name": "legal_last_name",
  "Name I prefer to be called": "preferred_name",
  Email: "email",
  //'Email Address': 'email',
  Phone: "phone",

  // Address
  "Street Address (including Apt #)": "address_street",
  City: "address_city",
  State: "address_state",
  "Zip Code": "address_zip",
  "Lamplight ESOL programs are open to people who live in Arlington, Medford, Somerville, Cambridge, Waltham or people who work in Arlington. Priority is given to people who live or work in Arlington.":
    "residence",

  // Demographics
  Age: "age",
  "Gender:": "gender",
  "Ethnicity: Are you Hispanic or Latino/Latina?": "ethnicity_hispanic_latino",
  "Race: (check all that apply)": "race",
  "Country of Birth": "country_of_birth",
  "Native Language": "native_language",
  "Language spoken at home": "language_spoken_at_home",

  // Education & Employment
  "Education: What is the highest level of schooling that you have completed?": "highest_education",
  "What is your current employment status: ": "employment",
  "Do you have access to a computer?": "computer_access",

  // Program Info
  "Where did you hear about Lamplight Women's Literacy Center? Who referred you to this program?": "referral",

  // Financial Info
  "Is your household income below the limit for the number of people in your family? (Instructions: Add together the total income of all people living in your home. Next, find the column for the number of people in your family. Is your household income lower than that number?)":
    "household_income",

  // Student Code (stored in DB)
  "Student Code": "student_code",

  // Returning Student Info, read-only, not stored in DB
  "Is returning": "is_returning",
};

// Map CSV headers to database column names for HCP program
const HCP_COLUMN_MAPPING: Record<string, string> = {
  // Basic Info
  "First Name": "legal_first_name",
  "Last Name": "legal_last_name",
  "Name I prefer to be called": "preferred_name",
  Email: "email",
  Phone: "phone",

  // Address
  "Street Address (include your Apt #)": "address_street",
  City: "address_city",
  State: "address_state",
  "Zip Code": "address_zip",

  // Demographics
  Age: "age",
  "Gender:": "gender",
  "Ethnicity: Are you Hispanic or Latino/Latina?": "ethnicity_hispanic_latino",
  "Race: (check all that apply)": "race",
  "Country of Birth": "country_of_birth",
  "Native Language": "native_language",
  "Language spoken at home": "language_spoken_at_home",

  // Education & Employment
  "Education: What is the highest level of schooling that you have completed?": "highest_education",
  "Where did you receive your highest level of education?": "education_location",
  "Do you have a high school diploma or equivalent (GED/HiSET)?": "has_high_school_diploma",
  "Are you currently:": "employment",

  "Do you have access to a computer? This course is online and requires students to participate with a computer. (Phones will not work for class activities and may not be used for class participation.)":
    "computer_access",

  "Where did you hear about this course?  (At your job, from a friend, flyer, etc.)": "referral",

  // HCP-Specific Fields
  "Are you a Certified Nursing Assistant (CNA)?": "is_cna",
  "Are you a Home Health Aide (HHA) or patient caregiver?": "is_home_health_aide",
  "Do you have another healthcare certification such as phlebotomy or medical assistant?":
    "has_healthcare_certification",
  "Which is true about you?": "healthcare_certification_details",
  "Title of your current job position:": "current_job_title",
  "Name of your current employer": "current_employer",
  "Which towns to you work in?": "work_towns",
  "Have you ever taken the TEAS exam before?": "has_taken_teas",
  "Class time availability:": "class_time_availability",
  "Placement Decision": "initial_placement_hcp",

  // Student Code (stored in DB)
  "Student Code": "student_code",

  // Returning Student Info, read-only, not stored in DB
  "Is returning": "is_returning",
};

/**
 * Get the appropriate column mapping based on program
 * @param program - Either "ESOL" or "HCP"
 * @returns The column mapping object for the specified program
 * @throws Error if program is not recognized
 */
export function getColumnMapping(program: string): Record<string, string> {
  if (program === "ESOL") {
    return ESOL_COLUMN_MAPPING;
  }
  if (program === "HCP") {
    return HCP_COLUMN_MAPPING;
  }
  throw new Error(`Unknown program: ${program}. Must be "ESOL" or "HCP"`);
}

export type CSVRow = Record<string, string | undefined>;

export type StudentData = Record<string, unknown>;

export function mapCSVRowToStudent(csvRow: CSVRow, program: string): StudentData {
  const mappedData: StudentData = {};
  const columnMapping = getColumnMapping(program);

  // Loop through CSV row and map to database columns
  for (const [csvHeader, value] of Object.entries(csvRow)) {
    const dbColumn = columnMapping[csvHeader];

    if (dbColumn && value !== null && value !== undefined && value !== "") {
      // Special handling: is_returning is read-only, so we don't store it in DB
      if (dbColumn === "is_returning") {
        mappedData[dbColumn] = transformValue(dbColumn, value);
      } else {
        mappedData[dbColumn] = transformValue(dbColumn, value);
      }
    }
  }

  return mappedData;
}

//Transform values to correct format for database
function transformValue(columnName: string, value: string): unknown {
  // Handle empty values
  if ((value ?? "") === "") {
    return null;
  }

  // Trim all string values
  const trimmedValue = typeof value === "string" ? value.trim() : value;

  // Column-specific transformations
  switch (columnName) {
    case "email": {
      return typeof trimmedValue === "string" ? trimmedValue.toLowerCase() : trimmedValue;
    }

    case "ethnicity_hispanic_latino": {
      // Convert "Yes" to true, anything else to false
      return typeof trimmedValue === "string" && trimmedValue.toLowerCase().includes("yes");
    }

    // HCP-specific boolean fields
    case "has_high_school_diploma":
    case "is_cna":
    case "has_healthcare_certification":
    case "has_taken_teas": {
      // Convert "Yes"/"Y"/"True"/"1" to true, "No"/"N"/"False"/"0" to false
      if (typeof trimmedValue === "string") {
        const lower = trimmedValue.toLowerCase();
        if (lower === "yes" || lower === "y" || lower === "true" || lower === "1") {
          return true;
        }
        if (lower === "no" || lower === "n" || lower === "false" || lower === "0") {
          return false;
        }
        // If it contains "yes", return true; if it contains "no", return false
        if (lower.includes("yes")) return true;
        if (lower.includes("no")) return false;
      }
      return null;
    }

    case "age": {
      const ageNum = typeof trimmedValue === "string" ? parseInt(trimmedValue, 10) : NaN;
      return Number.isNaN(ageNum) ? null : ageNum;
    }

    case "phone": {
      // Remove all non-digits
      return typeof trimmedValue === "string" ? trimmedValue.replace(/\D/g, "") : trimmedValue;
    }

    case "race": {
      // Handle multiple races
      if (typeof trimmedValue === "string" && trimmedValue.includes(",")) {
        return trimmedValue.split(",").map((r: string) => r.trim());
      }
      return [trimmedValue];
    }

    case "computer_access": {
      // Convert Yes/No/Maybe to standardized values
      if (typeof trimmedValue === "string") {
        const lower = trimmedValue.toLowerCase();
        if (lower.includes("yes")) return "yes";
        if (lower.includes("no")) return "no";
        if (lower.includes("maybe")) return "maybe";
      }
      return trimmedValue;
    }

    case "is_returning": {
      // Normalize is_returning to lowercase "yes" or "no"
      if (typeof trimmedValue === "string") {
        const lower = trimmedValue.toLowerCase();
        if (lower === "yes" || lower === "y" || lower === "true" || lower === "1") {
          return "yes";
        }
        if (lower === "no" || lower === "n" || lower === "false" || lower === "0") {
          return "no";
        }
        // Invalid value - return as is for validation to catch
        return trimmedValue;
      }
      return trimmedValue;
    }

    case "student_code": {
      // Validate and normalize student_code format (STU-XXXXX, 1-5 digits)
      // Values > 99,999 will be caught as "not found" during database lookup
      if (typeof trimmedValue === "string") {
        const normalized = trimmedValue.trim().toUpperCase();
        // Validate format: STU- followed by 1-5 digits
        const studentCodePattern = /^STU-\d{1,5}$/;
        if (studentCodePattern.test(normalized)) {
          return normalized;
        }
        // Invalid format - return as is for validation to catch
        return trimmedValue;
      }
      return trimmedValue;
    }

    default:
      return trimmedValue;
  }
}

// Validate that a student object has required fields
export function isValidStudent(student: StudentData): boolean {
  // Required fields
  const email = student.email;
  const hasEmail = typeof email === "string" && email.length > 0;
  const hasName = Boolean(student.legal_first_name ?? student.legal_last_name);

  return hasEmail && hasName;
}

// Get validation errors for a student
export function getValidationErrors(student: StudentData): string[] {
  const errors: string[] = [];

  if (!student.email || (typeof student.email === "string" && student.email.length === 0)) {
    errors.push("Missing email");
  }

  if (!student.legal_first_name && !student.legal_last_name) {
    errors.push("Missing both first and last name");
  }

  return errors;
}

// Validate is_returning field
export function validateIsReturning(isReturning: unknown): { valid: boolean; normalized?: string; error?: string } {
  if (isReturning === undefined || isReturning === null || isReturning === "") {
    return { valid: false, error: "Missing is_returning field" };
  }

  if (typeof isReturning === "string") {
    const lower = isReturning.toLowerCase();
    if (lower === "yes" || lower === "no") {
      return { valid: true, normalized: lower };
    }
  }

  const isReturningStr =
    typeof isReturning === "string"
      ? isReturning
      : typeof isReturning === "number"
        ? String(isReturning)
        : JSON.stringify(isReturning);
  return { valid: false, error: `Invalid is_returning value: ${isReturningStr}. Must be "yes" or "no"` };
}

// Validate student_code format
export function validateStudentCode(studentCode: unknown): { valid: boolean; normalized?: string; error?: string } {
  if (studentCode === undefined || studentCode === null || studentCode === "") {
    return { valid: false, error: "Missing student_code" };
  }

  if (typeof studentCode === "string") {
    const normalized = studentCode.trim().toUpperCase();
    const studentCodePattern = /^STU-\d{1,5}$/;
    if (studentCodePattern.test(normalized)) {
      return { valid: true, normalized };
    }
    return { valid: false, error: `Invalid student_code format: ${studentCode}. Must be STU-XXXXX (1-5 digits)` };
  }

  return { valid: false, error: `Invalid student_code type: ${typeof studentCode}` };
}

// Split students into new, returning, and invalid
export interface StudentSplitResult {
  newStudents: StudentData[];
  returningStudents: StudentData[];
  invalidStudents: { student: StudentData; error: string }[];
}

export function splitStudentsByReturningStatus(students: StudentData[]): StudentSplitResult {
  const result: StudentSplitResult = {
    newStudents: [],
    returningStudents: [],
    invalidStudents: [],
  };

  for (const student of students) {
    const isReturning = student.is_returning;
    const studentCode = student.student_code;

    // Validate is_returning
    const isReturningValidation = validateIsReturning(isReturning);
    if (!isReturningValidation.valid) {
      result.invalidStudents.push({
        student,
        error: isReturningValidation.error ?? "Invalid is_returning",
      });
      continue;
    }

    const normalizedIsReturning = isReturningValidation.normalized;

    // If is_returning is "yes", student_code is required
    if (normalizedIsReturning === "yes") {
      const codeValidation = validateStudentCode(studentCode);
      if (!codeValidation.valid) {
        result.invalidStudents.push({
          student,
          error: codeValidation.error ?? "Missing or invalid student_code for returning student",
        });
        continue;
      }

      // Valid returning student
      result.returningStudents.push(student);
    } else {
      // is_returning is "no" or empty - treat as new student
      // Remove student_code if present (will be auto-generated)
      const newStudent = { ...student };
      delete newStudent.student_code;
      result.newStudents.push(newStudent);
    }
  }

  return result;
}

// Detect name mismatches between CSV and database
export function detectNameMismatches(
  returningStudents: StudentData[],
  dbStudents: Map<string, Record<string, unknown>>,
  rowOffset = 0,
): {
  studentCode: string;
  dbFirstName: string;
  dbLastName: string;
  csvFirstName: string;
  csvLastName: string;
  csvRow: StudentData;
  rowNumber: number;
}[] {
  const mismatches: {
    studentCode: string;
    dbFirstName: string;
    dbLastName: string;
    csvFirstName: string;
    csvLastName: string;
    csvRow: StudentData;
    rowNumber: number;
  }[] = [];

  for (let i = 0; i < returningStudents.length; i++) {
    const csvStudent = returningStudents[i];
    if (!csvStudent) continue;

    const studentCode = csvStudent.student_code as string | undefined;

    if (!studentCode) {
      continue;
    }

    const dbStudent = dbStudents.get(studentCode);
    if (!dbStudent) {
      continue; // Will be caught as "not found" error later
    }

    const csvFirstName = (csvStudent.legal_first_name as string)?.trim() ?? "";
    const csvLastName = (csvStudent.legal_last_name as string)?.trim() ?? "";
    const dbFirstName = (dbStudent.legal_first_name as string)?.trim() ?? "";
    const dbLastName = (dbStudent.legal_last_name as string)?.trim() ?? "";

    // Check if names match (case-insensitive)
    if (
      csvFirstName.toLowerCase() !== dbFirstName.toLowerCase() ||
      csvLastName.toLowerCase() !== dbLastName.toLowerCase()
    ) {
      mismatches.push({
        studentCode,
        dbFirstName,
        dbLastName,
        csvFirstName,
        csvLastName,
        csvRow: csvStudent,
        rowNumber: rowOffset + i + 1,
      });
    }
  }

  return mismatches;
}

// Get only changed fields between existing and new student data
export function getChangedFields(
  existingStudent: Record<string, unknown>,
  csvStudent: StudentData,
): Record<string, unknown> {
  const changes: Record<string, unknown> = {};

  // Fields to never update
  const excludeFields = new Set(["id", "created_at", "created_by", "student_code"]);

  // Compare each field
  for (const [key, csvValue] of Object.entries(csvStudent)) {
    // Skip is_returning field
    if (key === "is_returning") {
      continue;
    }

    // Skip excluded fields
    if (excludeFields.has(key)) {
      continue;
    }

    const dbValue = existingStudent[key];

    // Deep comparison for arrays for instance race)
    if (Array.isArray(csvValue) && Array.isArray(dbValue)) {
      const csvSorted = [...csvValue].sort().join(",");
      const dbSorted = [...dbValue].sort().join(",");
      if (csvSorted !== dbSorted) {
        changes[key] = csvValue;
      }
    } else if (csvValue !== dbValue) {
      // Handle null/undefined comparison
      const csvNormalized = csvValue ?? null;
      const dbNormalized = dbValue ?? null;

      if (csvNormalized !== dbNormalized) {
        changes[key] = csvValue;
      }
    }
  }

  return changes;
}

// Helper function to convert detectNameMismatches result to NameMismatch format
export function convertToNameMismatches(mismatches: ReturnType<typeof detectNameMismatches>): {
  studentCode: string;
  dbFirstName: string;
  dbLastName: string;
  csvFirstName: string;
  csvLastName: string;
  csvRow: StudentData;
  rowNumber: number;
}[] {
  return mismatches;
}

/**
 * Map HCP Placement Decision CSV value to course_placement enum value
 * Converts format like "English TEAS - Spring 2025" to "HCP English TEAS"
 * @param placementDecision - The value from the "Placement Decision" column
 * @returns The mapped course_placement enum value, or null if invalid/missing
 */
export function mapHCPPlacementDecisionToEnum(placementDecision: string | undefined | null): string | null {
  if (!placementDecision || typeof placementDecision !== "string") {
    return null;
  }

  const trimmed = placementDecision.trim();
  if (trimmed === "") {
    return null;
  }

  // Split on the LAST dash to remove semester/year (e.g., "English Pre-TEAS part 2 - Winter 2025" -> "English Pre-TEAS part 2")
  // Handle variations: "English TEAS - Spring 2025", "English TEAS- Spring 2025", "English TEAS -Spring 2025", "English TEAS-Spring 2025"
  // We need to find the last dash that separates the course name from the semester/year
  // Look for pattern: dash followed by semester (Spring/Winter/Fall/Summer) followed by year
  const semesterYearPattern = /-\s*(Spring|Winter|Fall|Summer)\s+\d{4}$/i;
  const match = semesterYearPattern.exec(trimmed);

  let courseName: string | undefined;
  if (match?.index !== undefined) {
    // Found semester/year pattern, extract everything before the dash
    courseName = trimmed.substring(0, match.index).trim();
  } else {
    // No semester/year pattern found, try to split on last dash with spaces
    const lastDashIndex = trimmed.lastIndexOf(" - ");
    if (lastDashIndex >= 0) {
      courseName = trimmed.substring(0, lastDashIndex).trim();
    } else {
      // Try last dash without space before it
      const lastDashBeforeSpace = trimmed.lastIndexOf("- ");
      if (lastDashBeforeSpace >= 0) {
        courseName = trimmed.substring(0, lastDashBeforeSpace).trim();
      } else {
        // Last resort: use everything (no dash found)
        courseName = trimmed;
      }
    }
  }

  if (!courseName) {
    return null;
  }

  // Add "HCP " prefix to match enum format, ensure no extra whitespace
  const enumValue = `HCP ${courseName.trim()}`.trim();

  // Validate against known HCP enum values from Constants
  const validHCPPlacements = Constants.public.Enums.course_placement_enum.filter((placement) =>
    placement.startsWith("HCP "),
  ) as string[];

  // Check if the enum value matches any valid HCP placement (case-sensitive exact match)
  const normalizedEnumValue = enumValue.trim();
  if (validHCPPlacements.some((placement) => placement.trim() === normalizedEnumValue)) {
    return normalizedEnumValue;
  }

  // Return null if it doesn't match any valid enum value
  return null;
}
