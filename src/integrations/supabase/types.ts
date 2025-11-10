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
      carriers: {
        Row: {
          avg_quality_rating: number | null
          coverage_area: string | null
          created_at: string | null
          damage_rate: number | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          on_time_delivery_rate: number | null
          updated_at: string | null
        }
        Insert: {
          avg_quality_rating?: number | null
          coverage_area?: string | null
          created_at?: string | null
          damage_rate?: number | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          on_time_delivery_rate?: number | null
          updated_at?: string | null
        }
        Update: {
          avg_quality_rating?: number | null
          coverage_area?: string | null
          created_at?: string | null
          damage_rate?: number | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          on_time_delivery_rate?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      quote_items: {
        Row: {
          base_price: number
          carrier_id: string
          commission_applied: number
          created_at: string | null
          delivery_days: number
          final_price: number
          id: string
          quality_index: number | null
          quote_id: string
          route_adjustment_factor: number | null
          selected: boolean | null
        }
        Insert: {
          base_price: number
          carrier_id: string
          commission_applied: number
          created_at?: string | null
          delivery_days: number
          final_price: number
          id?: string
          quality_index?: number | null
          quote_id: string
          route_adjustment_factor?: number | null
          selected?: boolean | null
        }
        Update: {
          base_price?: number
          carrier_id?: string
          commission_applied?: number
          created_at?: string | null
          delivery_days?: number
          final_price?: number
          id?: string
          quality_index?: number | null
          quote_id?: string
          route_adjustment_factor?: number | null
          selected?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_items_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          created_at: string | null
          destination_cep: string
          height_cm: number | null
          id: string
          length_cm: number | null
          origin_cep: string
          status: string | null
          updated_at: string | null
          user_id: string | null
          weight_kg: number
          width_cm: number | null
        }
        Insert: {
          created_at?: string | null
          destination_cep: string
          height_cm?: number | null
          id?: string
          length_cm?: number | null
          origin_cep: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          weight_kg: number
          width_cm?: number | null
        }
        Update: {
          created_at?: string | null
          destination_cep?: string
          height_cm?: number | null
          id?: string
          length_cm?: number | null
          origin_cep?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          weight_kg?: number
          width_cm?: number | null
        }
        Relationships: []
      }
      routes: {
        Row: {
          adjustment_factor: number | null
          created_at: string | null
          demand_level: string | null
          destination_cep: string
          id: string
          origin_cep: string
          route_type: string
          updated_at: string | null
        }
        Insert: {
          adjustment_factor?: number | null
          created_at?: string | null
          demand_level?: string | null
          destination_cep: string
          id?: string
          origin_cep: string
          route_type: string
          updated_at?: string | null
        }
        Update: {
          adjustment_factor?: number | null
          created_at?: string | null
          demand_level?: string | null
          destination_cep?: string
          id?: string
          origin_cep?: string
          route_type?: string
          updated_at?: string | null
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
      [_ in never]: never
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
    Enums: {},
  },
} as const
