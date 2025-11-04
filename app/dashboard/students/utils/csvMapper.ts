// Map CSV headers to database column names
const COLUMN_MAPPING: Record<string, string> = {
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
};

export type CSVRow = Record<string, string | undefined>;

type StudentData = Record<string, unknown>;

export function mapCSVRowToStudent(csvRow: CSVRow): StudentData {
  const mappedData: StudentData = {};

  // Loop through CSV row and map to database columns
  for (const [csvHeader, value] of Object.entries(csvRow)) {
    const dbColumn = COLUMN_MAPPING[csvHeader];

    if (dbColumn && value !== null && value !== undefined && value !== "") {
      mappedData[dbColumn] = transformValue(dbColumn, value);
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

    case "age": {
      const ageNum = typeof trimmedValue === "string" ? parseInt(trimmedValue, 10) : NaN;
      return Number.isNaN(ageNum) ? null : ageNum;
    }

    case "phone": {
      // Remove all non-digits
      return typeof trimmedValue === "string" ? trimmedValue.replace(/\D/g, "") : trimmedValue;
    }

    case "race": {
      // Handle multiple races (comma-separated)
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
