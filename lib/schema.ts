export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5";
  };
  public: {
    Tables: {
      course_placement: {
        Row: {
          created_at: string;
          id: string;
          name: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      enrollment_status: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          program_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          program_id?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          program_id?: string;
        };
        Relationships: [];
      };
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
      program: {
        Row: {
          created_at: string;
          id: string;
          name: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
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
          computer_access: string | null;
          country_of_birth: string | null;
          course_placement: Database["public"]["Enums"]["course_placement_enum"];
          course_placement_id: string | null;
          created_at: string;
          created_by: string | null;
          email: string | null;
          employment: string | null;
          enrollment_status: Database["public"]["Enums"]["enrollment_status_enum"];
          enrollment_status_id: string | null;
          ethnicity_hispanic_latino: boolean | null;
          gender: Database["public"]["Enums"]["gender"] | null;
          highest_education: string | null;
          household_income: string | null;
          id: string;
          language_spoken_at_home: string | null;
          legal_first_name: string;
          legal_last_name: string;
          native_language: string | null;
          phone: string | null;
          preferred_name: string | null;
          program: Database["public"]["Enums"]["program_enum"];
          program_id: string | null;
          race: string[] | null;
          referral: string | null;
          residence: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          address_city?: string | null;
          address_state?: string | null;
          address_street?: string | null;
          address_zip?: string | null;
          age?: number | null;
          computer_access?: string | null;
          country_of_birth?: string | null;
          course_placement: Database["public"]["Enums"]["course_placement_enum"];
          course_placement_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          email?: string | null;
          employment?: string | null;
          enrollment_status?: Database["public"]["Enums"]["enrollment_status_enum"];
          enrollment_status_id?: string | null;
          ethnicity_hispanic_latino?: boolean | null;
          gender?: Database["public"]["Enums"]["gender"] | null;
          highest_education?: string | null;
          household_income?: string | null;
          id?: string;
          language_spoken_at_home?: string | null;
          legal_first_name: string;
          legal_last_name: string;
          native_language?: string | null;
          phone?: string | null;
          preferred_name?: string | null;
          program: Database["public"]["Enums"]["program_enum"];
          program_id?: string | null;
          race?: string[] | null;
          referral?: string | null;
          residence?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          address_city?: string | null;
          address_state?: string | null;
          address_street?: string | null;
          address_zip?: string | null;
          age?: number | null;
          computer_access?: string | null;
          country_of_birth?: string | null;
          course_placement?: Database["public"]["Enums"]["course_placement_enum"];
          course_placement_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          email?: string | null;
          employment?: string | null;
          enrollment_status?: Database["public"]["Enums"]["enrollment_status_enum"];
          enrollment_status_id?: string | null;
          ethnicity_hispanic_latino?: boolean | null;
          gender?: Database["public"]["Enums"]["gender"] | null;
          highest_education?: string | null;
          household_income?: string | null;
          id?: string;
          language_spoken_at_home?: string | null;
          legal_first_name?: string;
          legal_last_name?: string;
          native_language?: string | null;
          phone?: string | null;
          preferred_name?: string | null;
          program?: Database["public"]["Enums"]["program_enum"];
          program_id?: string | null;
          race?: string[] | null;
          referral?: string | null;
          residence?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "students_course_placement_id_fkey1";
            columns: ["course_placement_id"];
            isOneToOne: false;
            referencedRelation: "course_placement";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "students_enrollment_status_id_fkey";
            columns: ["enrollment_status_id"];
            isOneToOne: false;
            referencedRelation: "enrollment_status";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "students_program_id_fkey";
            columns: ["program_id"];
            isOneToOne: false;
            referencedRelation: "program";
            referencedColumns: ["id"];
          },
        ];
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
      gender: "Male" | "Female" | "Non-binary" | "Other" | "Prefer not to say";
      program_enum: "ESOL" | "HCP";
      role: "admin" | "teacher";
      states:
        | "AL"
        | "AK"
        | "AZ"
        | "AR"
        | "CA"
        | "CO"
        | "CT"
        | "DE"
        | "FL"
        | "GA"
        | "HI"
        | "ID"
        | "IL"
        | "IN"
        | "IA"
        | "KS"
        | "KY"
        | "LA"
        | "ME"
        | "MD"
        | "MA"
        | "MI"
        | "MN"
        | "MS"
        | "MO"
        | "MT"
        | "NE"
        | "NV"
        | "NH"
        | "NJ"
        | "NM"
        | "NY"
        | "NC"
        | "ND"
        | "OH"
        | "OK"
        | "OR"
        | "PA"
        | "RI"
        | "SC"
        | "SD"
        | "TN"
        | "TX"
        | "UT"
        | "VT"
        | "VA"
        | "WA"
        | "WV"
        | "WI"
        | "WY";
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
      gender: ["Male", "Female", "Non-binary", "Other", "Prefer not to say"],
      program_enum: ["ESOL", "HCP"],
      role: ["admin", "teacher"],
      states: [
        "AL",
        "AK",
        "AZ",
        "AR",
        "CA",
        "CO",
        "CT",
        "DE",
        "FL",
        "GA",
        "HI",
        "ID",
        "IL",
        "IN",
        "IA",
        "KS",
        "KY",
        "LA",
        "ME",
        "MD",
        "MA",
        "MI",
        "MN",
        "MS",
        "MO",
        "MT",
        "NE",
        "NV",
        "NH",
        "NJ",
        "NM",
        "NY",
        "NC",
        "ND",
        "OH",
        "OK",
        "OR",
        "PA",
        "RI",
        "SC",
        "SD",
        "TN",
        "TX",
        "UT",
        "VT",
        "VA",
        "WA",
        "WV",
        "WI",
        "WY",
      ],
    },
  },
} as const;
