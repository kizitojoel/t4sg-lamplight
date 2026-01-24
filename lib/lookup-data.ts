import { cache } from "react";
import "server-only";
import { createServerSupabaseClient } from "./server-utils";

/**
 * Centralized lookup data fetching with React cache.
 * These functions are cached per-request, so multiple components
 * can call them without triggering duplicate queries.
 */

export interface LookupItem {
  id: string;
  name: string;
}

/**
 * Fetches all active programs from the lookup table.
 * Cached per-request to prevent duplicate queries.
 */
export const getPrograms = cache(async (): Promise<LookupItem[]> => {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.from("program").select("id, name").eq("active", true).order("name");

  if (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to fetch programs:", error.message);
    return [];
  }

  return data ?? [];
});

/**
 * Fetches all active course placements from the lookup table.
 * Cached per-request to prevent duplicate queries.
 */
export const getCoursePlacements = cache(async (): Promise<LookupItem[]> => {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.from("course_placement").select("id, name").eq("active", true).order("name");

  if (error) {
    // eslint-disable-next-line no-console
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
  const [programs, coursePlacements] = await Promise.all([getPrograms(), getCoursePlacements()]);

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

// Session types
export interface Session {
  id: number;
  course_placement_id: string;
  quarter: "Winter" | "Spring" | "Summer" | "Fall";
  year: number;
  status: "upcoming" | "active" | "completed";
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

export type SessionWithDetails = Session & {
  course_name: string;
  display_name: string;
  enrolled_count: number;
};

/**
 * Fetches all sessions with details.
 */
export const getSessions = cache(async (): Promise<SessionWithDetails[]> => {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("sessions_with_details")
    .select("*")
    .order("year", { ascending: false })
    .order("quarter", { ascending: false });

  if (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to fetch sessions:", error.message);
    return [];
  }

  return (data ?? []) as SessionWithDetails[];
});

/**
 * Fetches active sessions only.
 */
export const getActiveSessions = cache(async (): Promise<SessionWithDetails[]> => {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("sessions_with_details")
    .select("*")
    .eq("status", "active")
    .order("year", { ascending: false })
    .order("quarter", { ascending: false });

  if (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to fetch active sessions:", error.message);
    return [];
  }

  return (data ?? []) as SessionWithDetails[];
});
