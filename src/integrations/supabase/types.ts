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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      bpc_submissions: {
        Row: {
          admin_token: string
          created_at: string
          id: string
          proof_url: string
          status: Database["public"]["Enums"]["bpc_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_token?: string
          created_at?: string
          id?: string
          proof_url: string
          status?: Database["public"]["Enums"]["bpc_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_token?: string
          created_at?: string
          id?: string
          proof_url?: string
          status?: Database["public"]["Enums"]["bpc_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      kyc_verification_attempts: {
        Row: {
          created_at: string
          id: string
          kind: string
          provider: string
          reference: string | null
          succeeded: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          provider: string
          reference?: string | null
          succeeded?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          provider?: string
          reference?: string | null
          succeeded?: boolean
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          kind: string
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          kind?: string
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          kind?: string
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          balance: number
          bvn_verification_status: Database["public"]["Enums"]["kyc_status"]
          bvn_verified_at: string | null
          created_at: string
          full_name: string
          id: string
          nin_verification_status: Database["public"]["Enums"]["kyc_status"]
          nin_verified_at: string | null
          phone: string
          referral_id: string
          updated_at: string
          user_id: string
          verification_tier: number
        }
        Insert: {
          balance?: number
          bvn_verification_status?: Database["public"]["Enums"]["kyc_status"]
          bvn_verified_at?: string | null
          created_at?: string
          full_name?: string
          id?: string
          nin_verification_status?: Database["public"]["Enums"]["kyc_status"]
          nin_verified_at?: string | null
          phone?: string
          referral_id: string
          updated_at?: string
          user_id: string
          verification_tier?: number
        }
        Update: {
          balance?: number
          bvn_verification_status?: Database["public"]["Enums"]["kyc_status"]
          bvn_verified_at?: string | null
          created_at?: string
          full_name?: string
          id?: string
          nin_verification_status?: Database["public"]["Enums"]["kyc_status"]
          nin_verified_at?: string | null
          phone?: string
          referral_id?: string
          updated_at?: string
          user_id?: string
          verification_tier?: number
        }
        Relationships: []
      }
      referrals: {
        Row: {
          admin_note: string | null
          bonus_amount: number
          bonus_transaction_id: string | null
          created_at: string
          fraud_status: Database["public"]["Enums"]["referral_fraud_status"]
          id: string
          referral_id: string
          referred_user_id: string
          referrer_user_id: string
          reviewed_at: string | null
          status: Database["public"]["Enums"]["referral_status"]
          successful_at: string | null
          updated_at: string
        }
        Insert: {
          admin_note?: string | null
          bonus_amount?: number
          bonus_transaction_id?: string | null
          created_at?: string
          fraud_status?: Database["public"]["Enums"]["referral_fraud_status"]
          id?: string
          referral_id: string
          referred_user_id: string
          referrer_user_id: string
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["referral_status"]
          successful_at?: string | null
          updated_at?: string
        }
        Update: {
          admin_note?: string | null
          bonus_amount?: number
          bonus_transaction_id?: string | null
          created_at?: string
          fraud_status?: Database["public"]["Enums"]["referral_fraud_status"]
          id?: string
          referral_id?: string
          referred_user_id?: string
          referrer_user_id?: string
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["referral_status"]
          successful_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_bonus_transaction_id_fkey"
            columns: ["bonus_transaction_id"]
            isOneToOne: false
            referencedRelation: "wallet_transactions"
            referencedColumns: ["id"]
          },
        ]
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
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string
          id: string
          reference: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string
          id?: string
          reference?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          reference?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_referral_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      process_referral_reward: {
        Args: { _referred_user_id: string }
        Returns: undefined
      }
      referral_code_exists: { Args: { _code: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
      bpc_status: "pending" | "approved" | "declined"
      kyc_status: "not_verified" | "pending" | "verified" | "failed"
      referral_fraud_status: "clean" | "under_review" | "fraud"
      referral_status: "pending" | "successful" | "rejected"
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
      bpc_status: ["pending", "approved", "declined"],
      kyc_status: ["not_verified", "pending", "verified", "failed"],
      referral_fraud_status: ["clean", "under_review", "fraud"],
      referral_status: ["pending", "successful", "rejected"],
    },
  },
} as const
