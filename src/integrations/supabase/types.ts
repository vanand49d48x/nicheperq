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
      admin_audit_logs: {
        Row: {
          action_details: Json | null
          action_type: string
          admin_user_id: string
          created_at: string
          id: string
          target_user_id: string
        }
        Insert: {
          action_details?: Json | null
          action_type: string
          admin_user_id: string
          created_at?: string
          id?: string
          target_user_id: string
        }
        Update: {
          action_details?: Json | null
          action_type?: string
          admin_user_id?: string
          created_at?: string
          id?: string
          target_user_id?: string
        }
        Relationships: []
      }
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
      ai_chat_messages: {
        Row: {
          context: Json | null
          created_at: string
          id: string
          message: string
          response: string
          user_id: string
        }
        Insert: {
          context?: Json | null
          created_at?: string
          id?: string
          message: string
          response: string
          user_id: string
        }
        Update: {
          context?: Json | null
          created_at?: string
          id?: string
          message?: string
          response?: string
          user_id?: string
        }
        Relationships: []
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
          note_type: string | null
          sentiment: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lead_id: string
          note_text: string
          note_type?: string | null
          sentiment?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lead_id?: string
          note_text?: string
          note_type?: string | null
          sentiment?: string | null
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
      email_accounts: {
        Row: {
          created_at: string
          from_email: string
          from_name: string
          id: string
          is_verified: boolean
          last_verified_at: string | null
          oauth_access_token_enc: string | null
          oauth_expires_at: string | null
          oauth_refresh_token_enc: string | null
          provider: string
          smtp_host: string | null
          smtp_password_enc: string | null
          smtp_port: number | null
          smtp_username: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          from_email: string
          from_name: string
          id?: string
          is_verified?: boolean
          last_verified_at?: string | null
          oauth_access_token_enc?: string | null
          oauth_expires_at?: string | null
          oauth_refresh_token_enc?: string | null
          provider: string
          smtp_host?: string | null
          smtp_password_enc?: string | null
          smtp_port?: number | null
          smtp_username?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          from_email?: string
          from_name?: string
          id?: string
          is_verified?: boolean
          last_verified_at?: string | null
          oauth_access_token_enc?: string | null
          oauth_expires_at?: string | null
          oauth_refresh_token_enc?: string | null
          provider?: string
          smtp_host?: string | null
          smtp_password_enc?: string | null
          smtp_port?: number | null
          smtp_username?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_tracking: {
        Row: {
          click_count: number | null
          email_clicked_at: string | null
          email_draft_id: string
          email_opened_at: string | null
          email_replied_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          open_count: number | null
          timestamp: string
        }
        Insert: {
          click_count?: number | null
          email_clicked_at?: string | null
          email_draft_id: string
          email_opened_at?: string | null
          email_replied_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          open_count?: number | null
          timestamp?: string
        }
        Update: {
          click_count?: number | null
          email_clicked_at?: string | null
          email_draft_id?: string
          email_opened_at?: string | null
          email_replied_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          open_count?: number | null
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
      knowledge_base_articles: {
        Row: {
          category_id: string | null
          content: string
          created_at: string
          created_by: string | null
          excerpt: string | null
          helpful_count: number | null
          id: string
          is_published: boolean
          published_at: string | null
          slug: string
          tags: string[] | null
          title: string
          updated_at: string
          view_count: number | null
        }
        Insert: {
          category_id?: string | null
          content: string
          created_at?: string
          created_by?: string | null
          excerpt?: string | null
          helpful_count?: number | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          slug: string
          tags?: string[] | null
          title: string
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          category_id?: string | null
          content?: string
          created_at?: string
          created_by?: string | null
          excerpt?: string | null
          helpful_count?: number | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          slug?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_base_articles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "knowledge_base_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_base_categories: {
        Row: {
          created_at: string
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      lead_ai_scores: {
        Row: {
          closing_probability: number
          created_at: string
          id: string
          intent_score: number
          lead_id: string
          quality_score: number
          reasoning: Json | null
          risk_score: number
        }
        Insert: {
          closing_probability: number
          created_at?: string
          id?: string
          intent_score: number
          lead_id: string
          quality_score: number
          reasoning?: Json | null
          risk_score: number
        }
        Update: {
          closing_probability?: number
          created_at?: string
          id?: string
          intent_score?: number
          lead_id?: string
          quality_score?: number
          reasoning?: Json | null
          risk_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "lead_ai_scores_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_interactions: {
        Row: {
          created_at: string
          id: string
          interaction_type: string
          lead_id: string
          metadata: Json | null
          occurred_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          interaction_type: string
          lead_id: string
          metadata?: Json | null
          occurred_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          interaction_type?: string
          lead_id?: string
          metadata?: Json | null
          occurred_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_interactions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_reviews: {
        Row: {
          author_name: string | null
          created_at: string | null
          id: string
          lead_id: string
          rating: number | null
          review_date: string | null
          review_text: string
          user_id: string
        }
        Insert: {
          author_name?: string | null
          created_at?: string | null
          id?: string
          lead_id: string
          rating?: number | null
          review_date?: string | null
          review_text: string
          user_id: string
        }
        Update: {
          author_name?: string | null
          created_at?: string | null
          id?: string
          lead_id?: string
          rating?: number | null
          review_date?: string | null
          review_text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_reviews_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          address: string | null
          ai_intent_score: number | null
          ai_quality_score: number | null
          business_name: string
          city: string
          closing_probability: number | null
          contact_status: string | null
          created_at: string
          id: string
          is_preview: boolean
          last_ai_analysis_at: string | null
          last_contacted_at: string | null
          latitude: number | null
          longitude: number | null
          next_follow_up_at: string | null
          niche: string
          notes: string | null
          phone: string | null
          rating: number | null
          recommended_action: string | null
          recommended_tone: string | null
          review_count: number | null
          risk_score: number | null
          search_id: string | null
          sentiment: string | null
          state: string | null
          tags: string[] | null
          updated_at: string
          user_id: string | null
          website: string | null
          zipcode: string | null
        }
        Insert: {
          address?: string | null
          ai_intent_score?: number | null
          ai_quality_score?: number | null
          business_name: string
          city: string
          closing_probability?: number | null
          contact_status?: string | null
          created_at?: string
          id?: string
          is_preview?: boolean
          last_ai_analysis_at?: string | null
          last_contacted_at?: string | null
          latitude?: number | null
          longitude?: number | null
          next_follow_up_at?: string | null
          niche: string
          notes?: string | null
          phone?: string | null
          rating?: number | null
          recommended_action?: string | null
          recommended_tone?: string | null
          review_count?: number | null
          risk_score?: number | null
          search_id?: string | null
          sentiment?: string | null
          state?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string | null
          website?: string | null
          zipcode?: string | null
        }
        Update: {
          address?: string | null
          ai_intent_score?: number | null
          ai_quality_score?: number | null
          business_name?: string
          city?: string
          closing_probability?: number | null
          contact_status?: string | null
          created_at?: string
          id?: string
          is_preview?: boolean
          last_ai_analysis_at?: string | null
          last_contacted_at?: string | null
          latitude?: number | null
          longitude?: number | null
          next_follow_up_at?: string | null
          niche?: string
          notes?: string | null
          phone?: string | null
          rating?: number | null
          recommended_action?: string | null
          recommended_tone?: string | null
          review_count?: number | null
          risk_score?: number | null
          search_id?: string | null
          sentiment?: string | null
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
          schedule_time: string | null
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
          schedule_time?: string | null
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
          schedule_time?: string | null
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
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: string | null
          created_at: string
          description: string
          id: string
          priority: Database["public"]["Enums"]["ticket_priority"]
          resolved_at: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string
          description: string
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string
          description?: string
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ticket_replies: {
        Row: {
          created_at: string
          id: string
          is_admin_reply: boolean
          message: string
          ticket_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_admin_reply?: boolean
          message: string
          ticket_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_admin_reply?: boolean
          message?: string
          ticket_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_replies_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          crm_tier: string | null
          custom_lead_limit: number | null
          has_ai_access: boolean
          has_crm_access: boolean
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          crm_tier?: string | null
          custom_lead_limit?: number | null
          has_ai_access?: boolean
          has_crm_access?: boolean
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          crm_tier?: string | null
          custom_lead_limit?: number | null
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
      workflow_enrollments: {
        Row: {
          completed_at: string | null
          created_at: string
          current_step_order: number
          enrolled_at: string
          id: string
          lead_id: string
          metadata: Json | null
          next_action_at: string | null
          status: string
          updated_at: string
          user_id: string
          workflow_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_step_order?: number
          enrolled_at?: string
          id?: string
          lead_id: string
          metadata?: Json | null
          next_action_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
          workflow_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_step_order?: number
          enrolled_at?: string
          id?: string
          lead_id?: string
          metadata?: Json | null
          next_action_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_enrollments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_enrollments_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "ai_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_steps: {
        Row: {
          action_type: string
          ai_prompt_hint: string | null
          branch_to_step_order: number | null
          condition_type: string | null
          condition_value: string | null
          created_at: string
          delay_days: number
          email_type: string | null
          id: string
          next_status: string | null
          step_order: number
          task_description: string | null
          task_title: string | null
          tone: string | null
          workflow_id: string
        }
        Insert: {
          action_type: string
          ai_prompt_hint?: string | null
          branch_to_step_order?: number | null
          condition_type?: string | null
          condition_value?: string | null
          created_at?: string
          delay_days?: number
          email_type?: string | null
          id?: string
          next_status?: string | null
          step_order: number
          task_description?: string | null
          task_title?: string | null
          tone?: string | null
          workflow_id: string
        }
        Update: {
          action_type?: string
          ai_prompt_hint?: string | null
          branch_to_step_order?: number | null
          condition_type?: string | null
          condition_value?: string | null
          created_at?: string
          delay_days?: number
          email_type?: string | null
          id?: string
          next_status?: string | null
          step_order?: number
          task_description?: string | null
          task_title?: string | null
          tone?: string | null
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_steps_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "ai_workflows"
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
      ticket_priority: "low" | "medium" | "high" | "urgent"
      ticket_status: "open" | "in_progress" | "resolved" | "closed"
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
      ticket_priority: ["low", "medium", "high", "urgent"],
      ticket_status: ["open", "in_progress", "resolved", "closed"],
    },
  },
} as const
