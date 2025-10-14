export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5";
  };
  public: {
    Tables: {
      profiles: {
        Row: {
          biography: string | null;
          display_name: string;
          email: string;
          id: string;
          phone: string | null;
          role: Database["public"]["Enums"]["role"];
        };
        Insert: {
          biography?: string | null;
          display_name: string;
          email: string;
          id: string;
          phone?: string | null;
          role?: Database["public"]["Enums"]["role"];
        };
        Update: {
          biography?: string | null;
          display_name?: string;
          email?: string;
          id?: string;
          phone?: string | null;
          role?: Database["public"]["Enums"]["role"];
        };
        Relationships: [];
      };
      students: {
        Row: {
          address_city: string | null;
          address_state: string | null;
          address_street: string | null;
          address_zip: string | null;
          age: number | null;
          country_of_birth: string | null;
          course_placement: Database["public"]["Enums"]["course_placement_enum"];
          created_at: string;
          created_by: string | null;
          email: string | null;
          enrollment_status: Database["public"]["Enums"]["enrollment_status_enum"];
          ethnicity_hispanic_latino: boolean | null;
          gender: string | null;
          id: string;
          language_spoken_at_home: string | null;
          legal_first_name: string;
          legal_last_name: string;
          native_language: string | null;
          phone: string | null;
          preferred_name: string | null;
          program: Database["public"]["Enums"]["program_enum"];
          race: string[] | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          address_city?: string | null;
          address_state?: string | null;
          address_street?: string | null;
          address_zip?: string | null;
          age?: number | null;
          country_of_birth?: string | null;
          course_placement: Database["public"]["Enums"]["course_placement_enum"];
          created_at?: string;
          created_by?: string | null;
          email?: string | null;
          enrollment_status?: Database["public"]["Enums"]["enrollment_status_enum"];
          ethnicity_hispanic_latino?: boolean | null;
          gender?: string | null;
          id?: string;
          language_spoken_at_home?: string | null;
          legal_first_name: string;
          legal_last_name: string;
          native_language?: string | null;
          phone?: string | null;
          preferred_name?: string | null;
          program: Database["public"]["Enums"]["program_enum"];
          race?: string[] | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          address_city?: string | null;
          address_state?: string | null;
          address_street?: string | null;
          address_zip?: string | null;
          age?: number | null;
          country_of_birth?: string | null;
          course_placement?: Database["public"]["Enums"]["course_placement_enum"];
          created_at?: string;
          created_by?: string | null;
          email?: string | null;
          enrollment_status?: Database["public"]["Enums"]["enrollment_status_enum"];
          ethnicity_hispanic_latino?: boolean | null;
          gender?: string | null;
          id?: string;
          language_spoken_at_home?: string | null;
          legal_first_name?: string;
          legal_last_name?: string;
          native_language?: string | null;
          phone?: string | null;
          preferred_name?: string | null;
          program?: Database["public"]["Enums"]["program_enum"];
          race?: string[] | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      course_placement_enum:
        | "ESOL Beginner L1 part 1"
        | "ESOL Beginner L1 part 2"
        | "ESOL Beginner L1 part 3"
        | "ESOL L2 part 1"
        | "ESOL L2 part 2"
        | "ESOL L2 part 3"
        | "ESOL Intermediate part 1"
        | "ESOL Intermediate part 2"
        | "ESOL Intermediate part 3"
        | "HCP English Pre-TEAS part 1"
        | "HCP English Pre-TEAS part 2"
        | "HCP English TEAS"
        | "HCP Math TEAS"
        | "Other";
      enrollment_status_enum: "active" | "inactive";
      program_enum: "ESOL" | "HCP";
      role: "admin" | "teacher";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      course_placement_enum: [
        "ESOL Beginner L1 part 1",
        "ESOL Beginner L1 part 2",
        "ESOL Beginner L1 part 3",
        "ESOL L2 part 1",
        "ESOL L2 part 2",
        "ESOL L2 part 3",
        "ESOL Intermediate part 1",
        "ESOL Intermediate part 2",
        "ESOL Intermediate part 3",
        "HCP English Pre-TEAS part 1",
        "HCP English Pre-TEAS part 2",
        "HCP English TEAS",
        "HCP Math TEAS",
        "Other",
      ],
      enrollment_status_enum: ["active", "inactive"],
      program_enum: ["ESOL", "HCP"],
      role: ["admin", "teacher"],
    },
  },
} as const;
