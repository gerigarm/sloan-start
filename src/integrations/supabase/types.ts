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
      chat_analytics: {
        Row: {
          created_at: string
          event: string
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event: string
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string
          event?: string
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_fallback: boolean
          role: string
          session_id: string
          sources: Json | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_fallback?: boolean
          role: string
          session_id: string
          sources?: Json | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_fallback?: boolean
          role?: string
          session_id?: string
          sources?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      knowledge_sources: {
        Row: {
          content: string
          content_type: Database["public"]["Enums"]["content_type"]
          created_at: string
          id: string
          is_active: boolean
          metadata: Json | null
          tags: string[]
          title: string
          updated_at: string
          url: string | null
          week_relevant: number | null
        }
        Insert: {
          content: string
          content_type: Database["public"]["Enums"]["content_type"]
          created_at?: string
          id?: string
          is_active?: boolean
          metadata?: Json | null
          tags?: string[]
          title: string
          updated_at?: string
          url?: string | null
          week_relevant?: number | null
        }
        Update: {
          content?: string
          content_type?: Database["public"]["Enums"]["content_type"]
          created_at?: string
          id?: string
          is_active?: boolean
          metadata?: Json | null
          tags?: string[]
          title?: string
          updated_at?: string
          url?: string | null
          week_relevant?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          concerns: string[] | null
          created_at: string
          full_name: string | null
          id: string
          is_international: boolean | null
          onboarding_completed: boolean
          primary_goals: string[] | null
          program_start_date: string | null
          relocation_status: string | null
          student_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          concerns?: string[] | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_international?: boolean | null
          onboarding_completed?: boolean
          primary_goals?: string[] | null
          program_start_date?: string | null
          relocation_status?: string | null
          student_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          concerns?: string[] | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_international?: boolean | null
          onboarding_completed?: boolean
          primary_goals?: string[] | null
          program_start_date?: string | null
          relocation_status?: string | null
          student_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_notes: {
        Row: {
          category: string
          created_at: string
          id: string
          is_completed: boolean
          title: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          is_completed?: boolean
          title: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_completed?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      weekly_checkins: {
        Row: {
          confidence_level: number
          control_level: number
          created_at: string
          id: string
          stress_causes: string[]
          stress_level: number
          user_id: string
          week_number: number | null
        }
        Insert: {
          confidence_level: number
          control_level: number
          created_at?: string
          id?: string
          stress_causes?: string[]
          stress_level: number
          user_id: string
          week_number?: number | null
        }
        Update: {
          confidence_level?: number
          control_level?: number
          created_at?: string
          id?: string
          stress_causes?: string[]
          stress_level?: number
          user_id?: string
          week_number?: number | null
        }
        Relationships: []
      }
      wellbeing_checkins: {
        Row: {
          created_at: string
          energy_level: number
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          energy_level: number
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          energy_level?: number
          id?: string
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
      content_type:
        | "faq"
        | "deadline"
        | "contact"
        | "policy"
        | "link"
        | "milestone"
        | "weekly_guidance"
        | "resource"
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
      content_type: [
        "faq",
        "deadline",
        "contact",
        "policy",
        "link",
        "milestone",
        "weekly_guidance",
        "resource",
      ],
    },
  },
} as const
