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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ai_automation_logs: {
        Row: {
          action_type: string
          ai_decision: Json | null
          created_at: string
          id: string
          lead_id: string | null
          success: boolean
          user_id: string
        }
        Insert: {
          action_type: string
          ai_decision?: Json | null
          created_at?: string
          id?: string
          lead_id?: string | null
          success?: boolean
          user_id: string
        }
        Update: {
          action_type?: string
          ai_decision?: Json | null
          created_at?: string
          id?: string
          lead_id?: string | null
          success?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_automation_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_email_drafts: {
        Row: {
          body: string
          created_at: string
          id: string
          lead_id: string
          opened_at: string | null
          replied_at: string | null
          send_at: string | null
          sent_at: string | null
          status: string
          subject: string
          tone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          lead_id: string
          opened_at?: string | null
          replied_at?: string | null
          send_at?: string | null
          sent_at?: string | null
          status?: string
          subject: string
          tone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          lead_id?: string
          opened_at?: string | null
          replied_at?: string | null
          send_at?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
          tone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_email_drafts_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_workflows: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          steps: Json
          trigger: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          steps: Json
          trigger: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          steps?: Json
          trigger?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      api_usage: {
        Row: {
          created_at: string
          id: string
          leads_count: number | null
          search_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          leads_count?: number | null
          search_type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          leads_count?: number | null
          search_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_notes: {
        Row: {
          created_at: string
          id: string
          lead_id: string
          note_text: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lead_id: string
          note_text: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lead_id?: string
          note_text?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_notes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      email_tracking: {
        Row: {
          email_draft_id: string
          event_data: Json | null
          event_type: string
          id: string
          timestamp: string
        }
        Insert: {
          email_draft_id: string
          event_data?: Json | null
          event_type: string
          id?: string
          timestamp?: string
        }
        Update: {
          email_draft_id?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_tracking_email_draft_id_fkey"
            columns: ["email_draft_id"]
            isOneToOne: false
            referencedRelation: "ai_email_drafts"
            referencedColumns: ["id"]
          },
        ]
      }
      free_tier_searches: {
        Row: {
          created_at: string
          id: string
          month_start: string
          search_count: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          month_start?: string
          search_count?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          month_start?: string
          search_count?: number
          user_id?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          address: string | null
          business_name: string
          city: string
          contact_status: string | null
          created_at: string
          id: string
          is_preview: boolean
          last_contacted_at: string | null
          latitude: number | null
          longitude: number | null
          next_follow_up_at: string | null
          niche: string
          notes: string | null
          phone: string | null
          rating: number | null
          review_count: number | null
          search_id: string | null
          state: string | null
          tags: string[] | null
          updated_at: string
          user_id: string | null
          website: string | null
          zipcode: string | null
        }
        Insert: {
          address?: string | null
          business_name: string
          city: string
          contact_status?: string | null
          created_at?: string
          id?: string
          is_preview?: boolean
          last_contacted_at?: string | null
          latitude?: number | null
          longitude?: number | null
          next_follow_up_at?: string | null
          niche: string
          notes?: string | null
          phone?: string | null
          rating?: number | null
          review_count?: number | null
          search_id?: string | null
          state?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string | null
          website?: string | null
          zipcode?: string | null
        }
        Update: {
          address?: string | null
          business_name?: string
          city?: string
          contact_status?: string | null
          created_at?: string
          id?: string
          is_preview?: boolean
          last_contacted_at?: string | null
          latitude?: number | null
          longitude?: number | null
          next_follow_up_at?: string | null
          niche?: string
          notes?: string | null
          phone?: string | null
          rating?: number | null
          review_count?: number | null
          search_id?: string | null
          state?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string | null
          website?: string | null
          zipcode?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_search_id_fkey"
            columns: ["search_id"]
            isOneToOne: false
            referencedRelation: "saved_searches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      saved_searches: {
        Row: {
          city: string
          created_at: string
          id: string
          is_active: boolean | null
          is_scheduled: boolean | null
          last_run_at: string | null
          lead_count: number | null
          name: string
          next_run_at: string | null
          niche: string
          radius: string
          schedule_frequency: string | null
          user_id: string
        }
        Insert: {
          city: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_scheduled?: boolean | null
          last_run_at?: string | null
          lead_count?: number | null
          name: string
          next_run_at?: string | null
          niche: string
          radius: string
          schedule_frequency?: string | null
          user_id: string
        }
        Update: {
          city?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_scheduled?: boolean | null
          last_run_at?: string | null
          lead_count?: number | null
          name?: string
          next_run_at?: string | null
          niche?: string
          radius?: string
          schedule_frequency?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_searches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_search_runs: {
        Row: {
          created_at: string | null
          error_message: string | null
          executed_at: string | null
          id: string
          leads_found: number | null
          search_id: string
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          executed_at?: string | null
          id?: string
          leads_found?: number | null
          search_id: string
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          executed_at?: string | null
          id?: string
          leads_found?: number | null
          search_id?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_search_runs_search_id_fkey"
            columns: ["search_id"]
            isOneToOne: false
            referencedRelation: "saved_searches"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          crm_tier: string | null
          has_ai_access: boolean
          has_crm_access: boolean
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          crm_tier?: string | null
          has_ai_access?: boolean
          has_crm_access?: boolean
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          crm_tier?: string | null
          has_ai_access?: boolean
          has_crm_access?: boolean
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_monthly_usage: { Args: { p_user_id: string }; Returns: number }
      get_user_monthly_limit: { Args: { p_user_id: string }; Returns: number }
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_usage_stats: {
        Args: { p_user_id: string }
        Returns: {
          last_search_date: string
          monthly_leads: number
          total_leads: number
        }[]
      }
      is_admin: { Args: { user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "pro" | "free" | "basic" | "standard" | "advanced"
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
      app_role: ["admin", "pro", "free", "basic", "standard", "advanced"],
    },
  },
} as const
