export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5";
  };
  public: {
    Tables: {
      allowed_emails: {
        Row: {
          created_at: string;
          created_by: string | null;
          email: string;
          id: number;
          role: Database["public"]["Enums"]["role"];
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          email: string;
          id?: number;
          role?: Database["public"]["Enums"]["role"];
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          email?: string;
          id?: number;
          role?: Database["public"]["Enums"]["role"];
        };
        Relationships: [
          {
            foreignKeyName: "allowed_emails_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      assessment_results: {
        Row: {
          assessment_id: string;
          course_offering_id: string | null;
          created_at: string;
          enrollment_id: string | null;
          id: string;
          score: number | null;
          student_id: string;
        };
        Insert: {
          assessment_id: string;
          course_offering_id?: string | null;
          created_at?: string;
          enrollment_id?: string | null;
          id?: string;
          score?: number | null;
          student_id: string;
        };
        Update: {
          assessment_id?: string;
          course_offering_id?: string | null;
          created_at?: string;
          enrollment_id?: string | null;
          id?: string;
          score?: number | null;
          student_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "assessment_results_assessment_id_fkey";
            columns: ["assessment_id"];
            isOneToOne: false;
            referencedRelation: "assessments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assessment_results_course_offering_id_fkey";
            columns: ["course_offering_id"];
            isOneToOne: false;
            referencedRelation: "course_placement";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assessment_results_enrollment_id_fkey";
            columns: ["enrollment_id"];
            isOneToOne: false;
            referencedRelation: "enrollments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assessment_results_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
        ];
      };
      assessments: {
        Row: {
          active: boolean;
          course_id: string | null;
          created_at: string;
          id: string;
          name: string;
        };
        Insert: {
          active?: boolean;
          course_id?: string | null;
          created_at?: string;
          id?: string;
          name: string;
        };
        Update: {
          active?: boolean;
          course_id?: string | null;
          created_at?: string;
          id?: string;
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "assessments_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "course_placement";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_course_id";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "course_placement";
            referencedColumns: ["id"];
          },
        ];
      };
      course_placement: {
        Row: {
          active: boolean;
          created_at: string;
          id: string;
          name: string;
        };
        Insert: {
          active?: boolean;
          created_at?: string;
          id?: string;
          name: string;
        };
        Update: {
          active?: boolean;
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
      enrollments: {
        Row: {
          created_at: string;
          ended_at: string | null;
          enrolled_at: string;
          id: string;
          is_current: boolean;
          notes: string | null;
          session_id: number;
          status: Database["public"]["Enums"]["enrollment_status_enum"];
          student_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          ended_at?: string | null;
          enrolled_at?: string;
          id?: string;
          is_current?: boolean;
          notes?: string | null;
          session_id: number;
          status?: Database["public"]["Enums"]["enrollment_status_enum"];
          student_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          ended_at?: string | null;
          enrolled_at?: string;
          id?: string;
          is_current?: boolean;
          notes?: string | null;
          session_id?: number;
          status?: Database["public"]["Enums"]["enrollment_status_enum"];
          student_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "enrollments_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "enrollments_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "sessions_with_details";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "enrollments_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
        ];
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
          active: boolean;
          created_at: string;
          id: string;
          name: string;
        };
        Insert: {
          active?: boolean;
          created_at?: string;
          id?: string;
          name?: string;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      sessions: {
        Row: {
          course_placement_id: string | null;
          created_at: string;
          end_date: string | null;
          id: number;
          quarter: Database["public"]["Enums"]["quarter_enum"];
          start_date: string | null;
          status: Database["public"]["Enums"]["session_status_enum"] | null;
          updated_at: string | null;
          year: number;
        };
        Insert: {
          course_placement_id?: string | null;
          created_at?: string;
          end_date?: string | null;
          id?: number;
          quarter: Database["public"]["Enums"]["quarter_enum"];
          start_date?: string | null;
          status?: Database["public"]["Enums"]["session_status_enum"] | null;
          updated_at?: string | null;
          year: number;
        };
        Update: {
          course_placement_id?: string | null;
          created_at?: string;
          end_date?: string | null;
          id?: number;
          quarter?: Database["public"]["Enums"]["quarter_enum"];
          start_date?: string | null;
          status?: Database["public"]["Enums"]["session_status_enum"] | null;
          updated_at?: string | null;
          year?: number;
        };
        Relationships: [
          {
            foreignKeyName: "sessions_course_placement_id_fkey";
            columns: ["course_placement_id"];
            isOneToOne: false;
            referencedRelation: "course_placement";
            referencedColumns: ["id"];
          },
        ];
      };
      students: {
        Row: {
          address_city: string | null;
          address_state: string | null;
          address_street: string | null;
          address_zip: string | null;
          advising_comments: Json;
          age: number | null;
          class_time_availability: string | null;
          computer_access: string | null;
          country_of_birth: string | null;
          course_placement_id: string | null;
          created_at: string;
          created_by: string | null;
          current_employer: string | null;
          current_job_title: string | null;
          education_location: string | null;
          email: string | null;
          employment: string | null;
          ethnicity_hispanic_latino: boolean | null;
          gender: Database["public"]["Enums"]["gender"] | null;
          has_healthcare_certification: string | null;
          has_high_school_diploma: boolean | null;
          has_taken_teas: boolean | null;
          healthcare_certification_details: string | null;
          highest_education: string | null;
          household_income: string | null;
          id: string;
          initial_placement_hcp: string | null;
          is_cna: boolean | null;
          is_home_health_aide: boolean | null;
          language_spoken_at_home: string | null;
          legal_first_name: string;
          legal_last_name: string;
          native_language: string | null;
          phone: string | null;
          preferred_name: string | null;
          program_id: string | null;
          race: string[] | null;
          referral: string | null;
          residence: string | null;
          student_code: string | null;
          updated_at: string;
          updated_by: string | null;
          work_towns: string | null;
        };
        Insert: {
          address_city?: string | null;
          address_state?: string | null;
          address_street?: string | null;
          address_zip?: string | null;
          advising_comments?: Json;
          age?: number | null;
          class_time_availability?: string | null;
          computer_access?: string | null;
          country_of_birth?: string | null;
          course_placement_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          current_employer?: string | null;
          current_job_title?: string | null;
          education_location?: string | null;
          email?: string | null;
          employment?: string | null;
          ethnicity_hispanic_latino?: boolean | null;
          gender?: Database["public"]["Enums"]["gender"] | null;
          has_healthcare_certification?: string | null;
          has_high_school_diploma?: boolean | null;
          has_taken_teas?: boolean | null;
          healthcare_certification_details?: string | null;
          highest_education?: string | null;
          household_income?: string | null;
          id?: string;
          initial_placement_hcp?: string | null;
          is_cna?: boolean | null;
          is_home_health_aide?: boolean | null;
          language_spoken_at_home?: string | null;
          legal_first_name: string;
          legal_last_name: string;
          native_language?: string | null;
          phone?: string | null;
          preferred_name?: string | null;
          program_id?: string | null;
          race?: string[] | null;
          referral?: string | null;
          residence?: string | null;
          student_code?: string | null;
          updated_at?: string;
          updated_by?: string | null;
          work_towns?: string | null;
        };
        Update: {
          address_city?: string | null;
          address_state?: string | null;
          address_street?: string | null;
          address_zip?: string | null;
          advising_comments?: Json;
          age?: number | null;
          class_time_availability?: string | null;
          computer_access?: string | null;
          country_of_birth?: string | null;
          course_placement_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          current_employer?: string | null;
          current_job_title?: string | null;
          education_location?: string | null;
          email?: string | null;
          employment?: string | null;
          ethnicity_hispanic_latino?: boolean | null;
          gender?: Database["public"]["Enums"]["gender"] | null;
          has_healthcare_certification?: string | null;
          has_high_school_diploma?: boolean | null;
          has_taken_teas?: boolean | null;
          healthcare_certification_details?: string | null;
          highest_education?: string | null;
          household_income?: string | null;
          id?: string;
          initial_placement_hcp?: string | null;
          is_cna?: boolean | null;
          is_home_health_aide?: boolean | null;
          language_spoken_at_home?: string | null;
          legal_first_name?: string;
          legal_last_name?: string;
          native_language?: string | null;
          phone?: string | null;
          preferred_name?: string | null;
          program_id?: string | null;
          race?: string[] | null;
          referral?: string | null;
          residence?: string | null;
          student_code?: string | null;
          updated_at?: string;
          updated_by?: string | null;
          work_towns?: string | null;
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
      sessions_with_details: {
        Row: {
          course_name: string | null;
          course_placement_id: string | null;
          created_at: string | null;
          display_name: string | null;
          end_date: string | null;
          enrolled_count: number | null;
          id: number | null;
          quarter: Database["public"]["Enums"]["quarter_enum"] | null;
          start_date: string | null;
          status: Database["public"]["Enums"]["session_status_enum"] | null;
          total_enrollment_count: number | null;
          year: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "sessions_course_placement_id_fkey";
            columns: ["course_placement_id"];
            isOneToOne: false;
            referencedRelation: "course_placement";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Functions: {
      isadmin: { Args: never; Returns: boolean };
    };
    Enums: {
      enrollment_status_enum: "enrolled" | "completed" | "dropped" | "withdrawn";
      gender: "Male" | "Female" | "Non-binary" | "Other" | "Prefer not to say";
      quarter_enum: "Fall" | "Winter" | "Spring" | "Summer";
      role: "admin" | "teacher";
      session_status_enum: "upcoming" | "active" | "completed";
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
      enrollment_status_enum: ["enrolled", "completed", "dropped", "withdrawn"],
      gender: ["Male", "Female", "Non-binary", "Other", "Prefer not to say"],
      quarter_enum: ["Fall", "Winter", "Spring", "Summer"],
      role: ["admin", "teacher"],
      session_status_enum: ["upcoming", "active", "completed"],
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
