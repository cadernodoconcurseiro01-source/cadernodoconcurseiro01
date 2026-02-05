export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      contests: {
        Row: {
          created_at: string
          cycle_days: number
          exam_date: string | null
          id: string
          is_active: boolean
          name: string
          study_plan_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          cycle_days?: number
          exam_date?: string | null
          id?: string
          is_active?: boolean
          name: string
          study_plan_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          cycle_days?: number
          exam_date?: string | null
          id?: string
          is_active?: boolean
          name?: string
          study_plan_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_questions: {
        Row: {
          correct_answers: number
          created_at: string
          id: string
          question_date: string
          subject_id: string
          total_questions: number
          updated_at: string
          user_id: string
          wrong_answers: number
        }
        Insert: {
          correct_answers?: number
          created_at?: string
          id?: string
          question_date?: string
          subject_id: string
          total_questions?: number
          updated_at?: string
          user_id: string
          wrong_answers?: number
        }
        Update: {
          correct_answers?: number
          created_at?: string
          id?: string
          question_date?: string
          subject_id?: string
          total_questions?: number
          updated_at?: string
          user_id?: string
          wrong_answers?: number
        }
        Relationships: [
          {
            foreignKeyName: "daily_questions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      flashcards: {
        Row: {
          back: string
          created_at: string
          ease_factor: number
          front: string
          id: string
          interval: number
          next_review: string
          repetitions: number
          subject_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          back: string
          created_at?: string
          ease_factor?: number
          front: string
          id?: string
          interval?: number
          next_review?: string
          repetitions?: number
          subject_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          back?: string
          created_at?: string
          ease_factor?: number
          front?: string
          id?: string
          interval?: number
          next_review?: string
          repetitions?: number
          subject_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcards_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          daily_study_hours: number | null
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_study_hours?: number | null
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          daily_study_hours?: number | null
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      simulados: {
        Row: {
          contest_id: string | null
          correct_answers: number
          created_at: string
          exam_date: string
          id: string
          name: string
          total_questions: number
          updated_at: string
          user_id: string
          wrong_answers: number
        }
        Insert: {
          contest_id?: string | null
          correct_answers?: number
          created_at?: string
          exam_date?: string
          id?: string
          name: string
          total_questions?: number
          updated_at?: string
          user_id: string
          wrong_answers?: number
        }
        Update: {
          contest_id?: string | null
          correct_answers?: number
          created_at?: string
          exam_date?: string
          id?: string
          name?: string
          total_questions?: number
          updated_at?: string
          user_id?: string
          wrong_answers?: number
        }
        Relationships: [
          {
            foreignKeyName: "simulados_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
        ]
      }
      study_cycles: {
        Row: {
          created_at: string
          current_day: number
          cycle_days: number
          daily_hours: number
          id: string
          plan_type: string
          subjects_per_day: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_day?: number
          cycle_days?: number
          daily_hours?: number
          id?: string
          plan_type?: string
          subjects_per_day?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_day?: number
          cycle_days?: number
          daily_hours?: number
          id?: string
          plan_type?: string
          subjects_per_day?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      study_sessions: {
        Row: {
          created_at: string
          duration: number
          end_time: string | null
          id: string
          start_time: string
          subject_id: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration: number
          end_time?: string | null
          id?: string
          start_time: string
          subject_id: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration?: number
          end_time?: string | null
          id?: string
          start_time?: string
          subject_id?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_sessions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          color: string
          contest_id: string | null
          created_at: string
          difficulty: Database["public"]["Enums"]["difficulty_level"]
          goal_minutes: number
          id: string
          name: string
          total_minutes: number
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          contest_id?: string | null
          created_at?: string
          difficulty?: Database["public"]["Enums"]["difficulty_level"]
          goal_minutes?: number
          id?: string
          name: string
          total_minutes?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          contest_id?: string | null
          created_at?: string
          difficulty?: Database["public"]["Enums"]["difficulty_level"]
          goal_minutes?: number
          id?: string
          name?: string
          total_minutes?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subjects_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
        ]
      }
      timer_settings: {
        Row: {
          created_at: string
          focus_duration: number
          id: string
          long_break_duration: number
          sessions_until_long_break: number
          short_break_duration: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          focus_duration?: number
          id?: string
          long_break_duration?: number
          sessions_until_long_break?: number
          short_break_duration?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          focus_duration?: number
          id?: string
          long_break_duration?: number
          sessions_until_long_break?: number
          short_break_duration?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      difficulty_level: "low" | "medium" | "high"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      difficulty_level: ["low", "medium", "high"],
    },
  },
} as const
