export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          actor_id: string
          after_data: Json | null
          before_data: Json | null
          created_at: string
          id: string
          notes: string | null
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          actor_id: string
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          id?: string
          notes?: string | null
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          actor_id?: string
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          id?: string
          notes?: string | null
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          id: boolean
          low_balance_threshold_kobo: number
          min_redeem_points: number
          point_value_kobo: number
          points_per_naira: number
          updated_at: string
        }
        Insert: {
          id?: boolean
          low_balance_threshold_kobo?: number
          min_redeem_points?: number
          point_value_kobo?: number
          points_per_naira?: number
          updated_at?: string
        }
        Update: {
          id?: boolean
          low_balance_threshold_kobo?: number
          min_redeem_points?: number
          point_value_kobo?: number
          points_per_naira?: number
          updated_at?: string
        }
        Relationships: []
      }
      beneficiaries: {
        Row: {
          created_at: string
          id: string
          identifier: string
          nickname: string
          provider_id: string
          service_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          identifier: string
          nickname: string
          provider_id: string
          service_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          identifier?: string
          nickname?: string
          provider_id?: string
          service_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      broadcast_reads: {
        Row: {
          broadcast_id: string
          created_at: string
          id: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          broadcast_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          broadcast_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "broadcast_reads_broadcast_id_fkey"
            columns: ["broadcast_id"]
            isOneToOne: false
            referencedRelation: "broadcasts"
            referencedColumns: ["id"]
          },
        ]
      }
      broadcasts: {
        Row: {
          audience: string
          audience_user_id: string | null
          body: string
          created_at: string
          created_by: string
          cta_label: string | null
          cta_url: string | null
          id: string
          title: string
        }
        Insert: {
          audience?: string
          audience_user_id?: string | null
          body: string
          created_at?: string
          created_by: string
          cta_label?: string | null
          cta_url?: string | null
          id?: string
          title: string
        }
        Update: {
          audience?: string
          audience_user_id?: string | null
          body?: string
          created_at?: string
          created_by?: string
          cta_label?: string | null
          cta_url?: string | null
          id?: string
          title?: string
        }
        Relationships: []
      }
      clubkonnect_balance_snapshots: {
        Row: {
          balance_kobo: number
          created_at: string
          id: string
          raw: Json | null
        }
        Insert: {
          balance_kobo: number
          created_at?: string
          id?: string
          raw?: Json | null
        }
        Update: {
          balance_kobo?: number
          created_at?: string
          id?: string
          raw?: Json | null
        }
        Relationships: []
      }
      loyalty_ledger: {
        Row: {
          balance_after: number
          created_at: string
          id: string
          notes: string | null
          points: number
          reference: string | null
          type: string
          user_id: string
        }
        Insert: {
          balance_after: number
          created_at?: string
          id?: string
          notes?: string | null
          points: number
          reference?: string | null
          type: string
          user_id: string
        }
        Update: {
          balance_after?: number
          created_at?: string
          id?: string
          notes?: string | null
          points?: number
          reference?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      loyalty_points: {
        Row: {
          balance: number
          lifetime_earned: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          lifetime_earned?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          lifetime_earned?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          referral_code: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          referral_code?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          referral_code?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      service_pricing: {
        Row: {
          base_cost_kobo: number
          created_at: string
          id: string
          is_active: boolean
          label: string | null
          markup_kobo: number
          markup_percent: number
          plan_code: string | null
          provider_id: string
          service_type: string
          updated_at: string
        }
        Insert: {
          base_cost_kobo?: number
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string | null
          markup_kobo?: number
          markup_percent?: number
          plan_code?: string | null
          provider_id: string
          service_type: string
          updated_at?: string
        }
        Update: {
          base_cost_kobo?: number
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string | null
          markup_kobo?: number
          markup_percent?: number
          plan_code?: string | null
          provider_id?: string
          service_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount_kobo: number
          clubkonnect_ref: string | null
          cost_kobo: number
          created_at: string
          id: string
          margin_kobo: number
          notes: string | null
          plan_code: string | null
          provider_id: string
          raw_response: Json | null
          recipient: string
          service_type: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_kobo: number
          clubkonnect_ref?: string | null
          cost_kobo?: number
          created_at?: string
          id?: string
          margin_kobo?: number
          notes?: string | null
          plan_code?: string | null
          provider_id: string
          raw_response?: Json | null
          recipient: string
          service_type: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_kobo?: number
          clubkonnect_ref?: string | null
          cost_kobo?: number
          created_at?: string
          id?: string
          margin_kobo?: number
          notes?: string | null
          plan_code?: string | null
          provider_id?: string
          raw_response?: Json | null
          recipient?: string
          service_type?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallet_ledger: {
        Row: {
          actor_id: string | null
          amount_kobo: number
          balance_after_kobo: number
          created_at: string
          id: string
          notes: string | null
          reference: string | null
          type: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          amount_kobo: number
          balance_after_kobo: number
          created_at?: string
          id?: string
          notes?: string | null
          reference?: string | null
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          amount_kobo?: number
          balance_after_kobo?: number
          created_at?: string
          id?: string
          notes?: string | null
          reference?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          balance_kobo: number
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance_kobo?: number
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance_kobo?: number
          created_at?: string
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
