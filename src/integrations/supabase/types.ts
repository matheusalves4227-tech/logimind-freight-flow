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
          carrier_size: string | null
          coverage_area: string | null
          created_at: string | null
          damage_rate: number | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          on_time_delivery_rate: number | null
          specialties: string[] | null
          updated_at: string | null
        }
        Insert: {
          avg_quality_rating?: number | null
          carrier_size?: string | null
          coverage_area?: string | null
          created_at?: string | null
          damage_rate?: number | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          on_time_delivery_rate?: number | null
          specialties?: string[] | null
          updated_at?: string | null
        }
        Update: {
          avg_quality_rating?: number | null
          carrier_size?: string | null
          coverage_area?: string | null
          created_at?: string | null
          damage_rate?: number | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          on_time_delivery_rate?: number | null
          specialties?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      driver_bids: {
        Row: {
          bid_price: number
          created_at: string
          delivery_date: string
          driver_profile_id: string
          id: string
          opportunity_id: string
          rejection_reason: string | null
          status: string
          updated_at: string
        }
        Insert: {
          bid_price: number
          created_at?: string
          delivery_date: string
          driver_profile_id: string
          id?: string
          opportunity_id: string
          rejection_reason?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          bid_price?: number
          created_at?: string
          delivery_date?: string
          driver_profile_id?: string
          id?: string
          opportunity_id?: string
          rejection_reason?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_bids_driver_profile_id_fkey"
            columns: ["driver_profile_id"]
            isOneToOne: false
            referencedRelation: "driver_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_cnh_data: {
        Row: {
          cnh_category: Database["public"]["Enums"]["cnh_category"]
          cnh_number: string
          created_at: string
          driver_profile_id: string
          expiry_date: string
          first_license_date: string | null
          id: string
          issue_date: string
          issuing_authority: string | null
          updated_at: string
        }
        Insert: {
          cnh_category: Database["public"]["Enums"]["cnh_category"]
          cnh_number: string
          created_at?: string
          driver_profile_id: string
          expiry_date: string
          first_license_date?: string | null
          id?: string
          issue_date: string
          issuing_authority?: string | null
          updated_at?: string
        }
        Update: {
          cnh_category?: Database["public"]["Enums"]["cnh_category"]
          cnh_number?: string
          created_at?: string
          driver_profile_id?: string
          expiry_date?: string
          first_license_date?: string | null
          id?: string
          issue_date?: string
          issuing_authority?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_cnh_data_driver_profile_id_fkey"
            columns: ["driver_profile_id"]
            isOneToOne: true
            referencedRelation: "driver_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_documents: {
        Row: {
          created_at: string
          document_number: string | null
          document_type: string
          driver_profile_id: string
          expiry_date: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          is_verified: boolean | null
          updated_at: string
          verification_notes: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          document_number?: string | null
          document_type: string
          driver_profile_id: string
          expiry_date?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          is_verified?: boolean | null
          updated_at?: string
          verification_notes?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          document_number?: string | null
          document_type?: string
          driver_profile_id?: string
          expiry_date?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          is_verified?: boolean | null
          updated_at?: string
          verification_notes?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_documents_driver_profile_id_fkey"
            columns: ["driver_profile_id"]
            isOneToOne: false
            referencedRelation: "driver_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_profiles: {
        Row: {
          address_cep: string
          address_city: string
          address_complement: string | null
          address_neighborhood: string
          address_number: string
          address_state: string
          address_street: string
          approval_notes: string | null
          approved_at: string | null
          approved_by: string | null
          cpf: string
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string
          rejected_reason: string | null
          status: Database["public"]["Enums"]["driver_status"]
          updated_at: string
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          address_cep: string
          address_city: string
          address_complement?: string | null
          address_neighborhood: string
          address_number: string
          address_state: string
          address_street: string
          approval_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          cpf: string
          created_at?: string
          email: string
          full_name: string
          id?: string
          phone: string
          rejected_reason?: string | null
          status?: Database["public"]["Enums"]["driver_status"]
          updated_at?: string
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          address_cep?: string
          address_city?: string
          address_complement?: string | null
          address_neighborhood?: string
          address_number?: string
          address_state?: string
          address_street?: string
          approval_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          cpf?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string
          rejected_reason?: string | null
          status?: Database["public"]["Enums"]["driver_status"]
          updated_at?: string
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      driver_vehicles: {
        Row: {
          brand: string | null
          color: string | null
          created_at: string
          crlv_expiry_date: string | null
          crlv_file_path: string | null
          driver_profile_id: string
          has_refrigeration: boolean | null
          has_sider: boolean | null
          has_tarp: boolean | null
          height_m: number | null
          id: string
          is_active: boolean | null
          is_open_body: boolean | null
          is_verified: boolean | null
          length_m: number | null
          license_plate: string
          max_volume_m3: number | null
          max_weight_kg: number
          model: string | null
          updated_at: string
          vehicle_type: Database["public"]["Enums"]["vehicle_type"]
          width_m: number | null
          year: number | null
        }
        Insert: {
          brand?: string | null
          color?: string | null
          created_at?: string
          crlv_expiry_date?: string | null
          crlv_file_path?: string | null
          driver_profile_id: string
          has_refrigeration?: boolean | null
          has_sider?: boolean | null
          has_tarp?: boolean | null
          height_m?: number | null
          id?: string
          is_active?: boolean | null
          is_open_body?: boolean | null
          is_verified?: boolean | null
          length_m?: number | null
          license_plate: string
          max_volume_m3?: number | null
          max_weight_kg: number
          model?: string | null
          updated_at?: string
          vehicle_type: Database["public"]["Enums"]["vehicle_type"]
          width_m?: number | null
          year?: number | null
        }
        Update: {
          brand?: string | null
          color?: string | null
          created_at?: string
          crlv_expiry_date?: string | null
          crlv_file_path?: string | null
          driver_profile_id?: string
          has_refrigeration?: boolean | null
          has_sider?: boolean | null
          has_tarp?: boolean | null
          height_m?: number | null
          id?: string
          is_active?: boolean | null
          is_open_body?: boolean | null
          is_verified?: boolean | null
          length_m?: number | null
          license_plate?: string
          max_volume_m3?: number | null
          max_weight_kg?: number
          model?: string | null
          updated_at?: string
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"]
          width_m?: number | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_vehicles_driver_profile_id_fkey"
            columns: ["driver_profile_id"]
            isOneToOne: false
            referencedRelation: "driver_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          actual_delivery: string | null
          base_price: number
          carrier_id: string | null
          carrier_name: string
          commission_applied: number
          created_at: string
          current_latitude: number | null
          current_longitude: number | null
          destination_address: string
          destination_cep: string
          driver_name: string | null
          driver_phone: string | null
          estimated_delivery: string | null
          external_tracking_code: string | null
          final_price: number
          height_cm: number | null
          id: string
          last_location_update: string | null
          length_cm: number | null
          origin_address: string
          origin_cep: string
          quote_id: string | null
          service_type: string
          status: string
          tracking_code: string
          updated_at: string
          user_id: string
          vehicle_type: string | null
          weight_kg: number
          width_cm: number | null
        }
        Insert: {
          actual_delivery?: string | null
          base_price: number
          carrier_id?: string | null
          carrier_name: string
          commission_applied: number
          created_at?: string
          current_latitude?: number | null
          current_longitude?: number | null
          destination_address: string
          destination_cep: string
          driver_name?: string | null
          driver_phone?: string | null
          estimated_delivery?: string | null
          external_tracking_code?: string | null
          final_price: number
          height_cm?: number | null
          id?: string
          last_location_update?: string | null
          length_cm?: number | null
          origin_address: string
          origin_cep: string
          quote_id?: string | null
          service_type: string
          status?: string
          tracking_code: string
          updated_at?: string
          user_id: string
          vehicle_type?: string | null
          weight_kg: number
          width_cm?: number | null
        }
        Update: {
          actual_delivery?: string | null
          base_price?: number
          carrier_id?: string | null
          carrier_name?: string
          commission_applied?: number
          created_at?: string
          current_latitude?: number | null
          current_longitude?: number | null
          destination_address?: string
          destination_cep?: string
          driver_name?: string | null
          driver_phone?: string | null
          estimated_delivery?: string | null
          external_tracking_code?: string | null
          final_price?: number
          height_cm?: number | null
          id?: string
          last_location_update?: string | null
          length_cm?: number | null
          origin_address?: string
          origin_cep?: string
          quote_id?: string | null
          service_type?: string
          status?: string
          tracking_code?: string
          updated_at?: string
          user_id?: string
          vehicle_type?: string | null
          weight_kg?: number
          width_cm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
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
      tracking_events: {
        Row: {
          city: string | null
          created_at: string
          event_code: string
          event_description: string
          event_timestamp: string
          id: string
          is_critical: boolean | null
          order_id: string
          raw_data: Json | null
          state: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string
          event_code: string
          event_description: string
          event_timestamp: string
          id?: string
          is_critical?: boolean | null
          order_id: string
          raw_data?: Json | null
          state?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string
          event_code?: string
          event_description?: string
          event_timestamp?: string
          id?: string
          is_critical?: boolean | null
          order_id?: string
          raw_data?: Json | null
          state?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tracking_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      cnh_category: "A" | "B" | "C" | "D" | "E" | "AB" | "AC" | "AD" | "AE"
      driver_status: "pending" | "approved" | "rejected" | "suspended"
      vehicle_type:
        | "moto"
        | "carro"
        | "picape"
        | "van"
        | "caminhao_toco"
        | "caminhao_truck"
        | "carreta"
        | "carreta_ls"
        | "carreta_bi_truck"
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
      cnh_category: ["A", "B", "C", "D", "E", "AB", "AC", "AD", "AE"],
      driver_status: ["pending", "approved", "rejected", "suspended"],
      vehicle_type: [
        "moto",
        "carro",
        "picape",
        "van",
        "caminhao_toco",
        "caminhao_truck",
        "carreta",
        "carreta_ls",
        "carreta_bi_truck",
      ],
    },
  },
} as const
