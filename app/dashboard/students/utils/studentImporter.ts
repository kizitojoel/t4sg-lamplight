// studentImporter.ts
"use server";

import type { TablesInsert } from "@/lib/schema";
import { createServerSupabaseClient } from "@/lib/server-utils";

export interface ImportResult {
  success: boolean;
  count: number;
  error?: string;
  details?: unknown;
}

//Import students to Supabase database
export async function importStudentsToSupabase(students: TablesInsert<"students">[]): Promise<ImportResult> {
  try {
    // Validate input
    if ((students ?? []).length === 0) {
      return {
        success: false,
        count: 0,
        error: "No students to import",
      };
    }

    const supabase = createServerSupabaseClient();

    // Insert students into database
    const { data, error } = await supabase.from("students").insert(students).select();

    if (error) {
      return {
        success: false,
        count: 0,
        error: error.message,
        details: error,
      };
    }

    return {
      success: true,
      count: data?.length ?? students.length,
      details: data,
    };
  } catch (error) {
    return {
      success: false,
      count: 0,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// Import students in batches (for large CSV files)
export async function importStudentsInBatches(
  students: TablesInsert<"students">[],
  batchSize = 100,
): Promise<ImportResult> {
  try {
    const supabase = createServerSupabaseClient();
    let totalImported = 0;
    const errors: string[] = [];

    // Process in batches
    for (let i = 0; i < students.length; i += batchSize) {
      const batch = students.slice(i, i + batchSize);

      const { data, error } = await supabase.from("students").insert(batch).select();

      if (error) {
        errors.push(`Batch ${i / batchSize + 1}: ${error.message}`);
      } else {
        totalImported += data?.length ?? 0;
      }
    }

    if (errors.length > 0) {
      return {
        success: false,
        count: totalImported,
        error: `Some batches failed: ${errors.join(", ")}`,
      };
    }

    return {
      success: true,
      count: totalImported,
    };
  } catch (error) {
    return {
      success: false,
      count: 0,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
