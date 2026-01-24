import "server-only";
import { cache } from "react";
import { createServerSupabaseClient } from "./server-utils";

/**
 * Centralized lookup data fetching with React cache.
 * These functions are cached per-request, so multiple components
 * can call them without triggering duplicate queries.
 */

export type LookupItem = { id: string; name: string };

/**
 * Fetches all programs from the lookup table.
 * Cached per-request to prevent duplicate queries.
 */
export const getPrograms = cache(async (): Promise<LookupItem[]> => {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("program")
    .select("id, name")
    .order("name");

  if (error) {
    console.error("Failed to fetch programs:", error.message);
    return [];
  }

  return data ?? [];
});

/**
 * Fetches all course placements from the lookup table.
 * Cached per-request to prevent duplicate queries.
 */
export const getCoursePlacements = cache(async (): Promise<LookupItem[]> => {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("course_placement")
    .select("id, name")
    .order("name");

  if (error) {
    console.error("Failed to fetch course placements:", error.message);
    return [];
  }

  return data ?? [];
});

/**
 * Fetches all lookup data in parallel.
 * Use this when you need multiple lookup tables at once.
 */
export const getAllLookupData = cache(async () => {
  const [programs, coursePlacements] = await Promise.all([
    getPrograms(),
    getCoursePlacements(),
  ]);

  return { programs, coursePlacements };
});

/**
 * Creates lookup maps for efficient ID -> name resolution.
 * Useful for displaying names from IDs without additional queries.
 */
export function createLookupMaps(data: { programs: LookupItem[]; coursePlacements: LookupItem[] }) {
  return {
    programMap: new Map(data.programs.map((p) => [p.id, p.name])),
    coursePlacementMap: new Map(data.coursePlacements.map((c) => [c.id, c.name])),
  };
}
