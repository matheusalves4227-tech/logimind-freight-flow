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
      b2b_carriers: {
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
          avg_monthly_capacity: number | null
          cnpj: string
          coverage_regions: string[] | null
          created_at: string
          email: string
          fleet_size: number | null
          id: string
          nome_fantasia: string | null
          razao_social: string
          rejected_reason: string | null
          status: string
          telefone: string
          updated_at: string
          user_id: string
          vehicle_types: string[] | null
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
          avg_monthly_capacity?: number | null
          cnpj: string
          coverage_regions?: string[] | null
          created_at?: string
          email: string
          fleet_size?: number | null
          id?: string
          nome_fantasia?: string | null
          razao_social: string
          rejected_reason?: string | null
          status?: string
          telefone: string
          updated_at?: string
          user_id: string
          vehicle_types?: string[] | null
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
          avg_monthly_capacity?: number | null
          cnpj?: string
          coverage_regions?: string[] | null
          created_at?: string
          email?: string
          fleet_size?: number | null
          id?: string
          nome_fantasia?: string | null
          razao_social?: string
          rejected_reason?: string | null
          status?: string
          telefone?: string
          updated_at?: string
          user_id?: string
          vehicle_types?: string[] | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      b2b_quotes: {
        Row: {
          aceita_rota_retorno: boolean | null
          armazenagem_cliente: boolean | null
          carga_fragil: boolean | null
          carga_perigosa: boolean | null
          cnpj: string
          contato_responsavel: string
          contrato_aprovado_em: string | null
          contrato_aprovado_por: string | null
          contrato_data_fim: string | null
          contrato_data_inicio: string | null
          contrato_valor_mensal: number | null
          created_at: string
          email: string
          flexibilidade_horario: boolean | null
          frequencia_envios: string
          id: string
          logistica_reversa: boolean | null
          necessita_seguro: boolean | null
          observacoes: string | null
          pedagios_cliente: boolean | null
          peso_medio_kg: number
          prazo_entrega_dias: number | null
          proposta_desconto_percentual: number | null
          proposta_enviada_em: string | null
          proposta_enviada_por: string | null
          proposta_observacoes: string | null
          proposta_valor_mensal: number | null
          razao_social: string
          rotas_destino: string
          rotas_origem: string
          sla_desejado: string
          status: string
          telefone: string
          tipo_carga: string
          updated_at: string
          user_id: string
          valor_medio_carga: number | null
          volume_mensal_estimado: number
        }
        Insert: {
          aceita_rota_retorno?: boolean | null
          armazenagem_cliente?: boolean | null
          carga_fragil?: boolean | null
          carga_perigosa?: boolean | null
          cnpj: string
          contato_responsavel: string
          contrato_aprovado_em?: string | null
          contrato_aprovado_por?: string | null
          contrato_data_fim?: string | null
          contrato_data_inicio?: string | null
          contrato_valor_mensal?: number | null
          created_at?: string
          email: string
          flexibilidade_horario?: boolean | null
          frequencia_envios: string
          id?: string
          logistica_reversa?: boolean | null
          necessita_seguro?: boolean | null
          observacoes?: string | null
          pedagios_cliente?: boolean | null
          peso_medio_kg: number
          prazo_entrega_dias?: number | null
          proposta_desconto_percentual?: number | null
          proposta_enviada_em?: string | null
          proposta_enviada_por?: string | null
          proposta_observacoes?: string | null
          proposta_valor_mensal?: number | null
          razao_social: string
          rotas_destino: string
          rotas_origem: string
          sla_desejado: string
          status?: string
          telefone: string
          tipo_carga: string
          updated_at?: string
          user_id: string
          valor_medio_carga?: number | null
          volume_mensal_estimado: number
        }
        Update: {
          aceita_rota_retorno?: boolean | null
          armazenagem_cliente?: boolean | null
          carga_fragil?: boolean | null
          carga_perigosa?: boolean | null
          cnpj?: string
          contato_responsavel?: string
          contrato_aprovado_em?: string | null
          contrato_aprovado_por?: string | null
          contrato_data_fim?: string | null
          contrato_data_inicio?: string | null
          contrato_valor_mensal?: number | null
          created_at?: string
          email?: string
          flexibilidade_horario?: boolean | null
          frequencia_envios?: string
          id?: string
          logistica_reversa?: boolean | null
          necessita_seguro?: boolean | null
          observacoes?: string | null
          pedagios_cliente?: boolean | null
          peso_medio_kg?: number
          prazo_entrega_dias?: number | null
          proposta_desconto_percentual?: number | null
          proposta_enviada_em?: string | null
          proposta_enviada_por?: string | null
          proposta_observacoes?: string | null
          proposta_valor_mensal?: number | null
          razao_social?: string
          rotas_destino?: string
          rotas_origem?: string
          sla_desejado?: string
          status?: string
          telefone?: string
          tipo_carga?: string
          updated_at?: string
          user_id?: string
          valor_medio_carga?: number | null
          volume_mensal_estimado?: number
        }
        Relationships: []
      }
      carrier_price_table: {
        Row: {
          base_price: number
          carrier_id: string
          created_at: string
          delivery_days: number
          destination_region: string
          destination_state: string | null
          fixed_cost: number | null
          id: string
          is_active: boolean
          max_distance_km: number | null
          max_weight_kg: number
          min_distance_km: number | null
          min_weight_kg: number
          origin_region: string
          origin_state: string | null
          price_per_kg: number
          rate_per_km: number | null
          updated_at: string
        }
        Insert: {
          base_price: number
          carrier_id: string
          created_at?: string
          delivery_days: number
          destination_region: string
          destination_state?: string | null
          fixed_cost?: number | null
          id?: string
          is_active?: boolean
          max_distance_km?: number | null
          max_weight_kg: number
          min_distance_km?: number | null
          min_weight_kg?: number
          origin_region: string
          origin_state?: string | null
          price_per_kg?: number
          rate_per_km?: number | null
          updated_at?: string
        }
        Update: {
          base_price?: number
          carrier_id?: string
          created_at?: string
          delivery_days?: number
          destination_region?: string
          destination_state?: string | null
          fixed_cost?: number | null
          id?: string
          is_active?: boolean
          max_distance_km?: number | null
          max_weight_kg?: number
          min_distance_km?: number | null
          min_weight_kg?: number
          origin_region?: string
          origin_state?: string | null
          price_per_kg?: number
          rate_per_km?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "carrier_price_table_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "carriers"
            referencedColumns: ["id"]
          },
        ]
      }
      carriers: {
        Row: {
          avg_quality_rating: number | null
          base_rate_per_kg: number | null
          base_rate_per_km: number | null
          carrier_size: string | null
          commercial_notes: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          contact_whatsapp: string | null
          coverage_area: string | null
          coverage_states: string[] | null
          coverage_type: string | null
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
          base_rate_per_kg?: number | null
          base_rate_per_km?: number | null
          carrier_size?: string | null
          commercial_notes?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contact_whatsapp?: string | null
          coverage_area?: string | null
          coverage_states?: string[] | null
          coverage_type?: string | null
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
          base_rate_per_kg?: number | null
          base_rate_per_km?: number | null
          carrier_size?: string | null
          commercial_notes?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contact_whatsapp?: string | null
          coverage_area?: string | null
          coverage_states?: string[] | null
          coverage_type?: string | null
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
          {
            foreignKeyName: "driver_bids_driver_profile_id_fkey"
            columns: ["driver_profile_id"]
            isOneToOne: false
            referencedRelation: "vw_pedidos_para_repasse"
            referencedColumns: ["driver_profile_id"]
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
          {
            foreignKeyName: "driver_cnh_data_driver_profile_id_fkey"
            columns: ["driver_profile_id"]
            isOneToOne: true
            referencedRelation: "vw_pedidos_para_repasse"
            referencedColumns: ["driver_profile_id"]
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
          {
            foreignKeyName: "driver_documents_driver_profile_id_fkey"
            columns: ["driver_profile_id"]
            isOneToOne: false
            referencedRelation: "vw_pedidos_para_repasse"
            referencedColumns: ["driver_profile_id"]
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
          bank_account_digit: string | null
          bank_account_number: string | null
          bank_account_type: string | null
          bank_agency: string | null
          bank_name: string | null
          cpf: string
          created_at: string
          email: string
          foto_perfil_url: string | null
          full_name: string
          id: string
          phone: string
          pix_key: string | null
          pix_key_type: string | null
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
          bank_account_digit?: string | null
          bank_account_number?: string | null
          bank_account_type?: string | null
          bank_agency?: string | null
          bank_name?: string | null
          cpf: string
          created_at?: string
          email: string
          foto_perfil_url?: string | null
          full_name: string
          id?: string
          phone: string
          pix_key?: string | null
          pix_key_type?: string | null
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
          bank_account_digit?: string | null
          bank_account_number?: string | null
          bank_account_type?: string | null
          bank_agency?: string | null
          bank_name?: string | null
          cpf?: string
          created_at?: string
          email?: string
          foto_perfil_url?: string | null
          full_name?: string
          id?: string
          phone?: string
          pix_key?: string | null
          pix_key_type?: string | null
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
          {
            foreignKeyName: "driver_vehicles_driver_profile_id_fkey"
            columns: ["driver_profile_id"]
            isOneToOne: false
            referencedRelation: "vw_pedidos_para_repasse"
            referencedColumns: ["driver_profile_id"]
          },
        ]
      }
      financial_transactions: {
        Row: {
          amount: number
          created_at: string
          error_message: string | null
          gateway_response: Json | null
          gateway_transaction_id: string | null
          id: string
          order_id: string
          processed_at: string | null
          status: Database["public"]["Enums"]["transaction_status"]
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          error_message?: string | null
          gateway_response?: Json | null
          gateway_transaction_id?: string | null
          id?: string
          order_id: string
          processed_at?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          error_message?: string | null
          gateway_response?: Json | null
          gateway_transaction_id?: string | null
          id?: string
          order_id?: string
          processed_at?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "vw_pedidos_para_repasse"
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
          codigo_coleta: string | null
          comissao_logimarket_perc: number | null
          comissao_logimarket_val: number | null
          commission_applied: number
          created_at: string
          current_latitude: number | null
          current_longitude: number | null
          destination_address: string
          destination_cep: string
          driver_id: string | null
          driver_name: string | null
          driver_phone: string | null
          estimated_delivery: string | null
          external_tracking_code: string | null
          final_price: number
          gateway_transaction_id: string | null
          height_cm: number | null
          id: string
          last_location_update: string | null
          length_cm: number | null
          operational_notes: string | null
          origin_address: string
          origin_cep: string
          paid_at: string | null
          payment_method: string | null
          quote_id: string | null
          repasse_data_limite: string | null
          service_type: string
          status: string
          status_pagamento: string | null
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          tracking_code: string
          updated_at: string
          user_id: string
          validado_em: string | null
          validado_para_coleta: boolean | null
          validado_por_email: string | null
          validado_por_nome: string | null
          valor_repasse_liquido: number | null
          vehicle_type: string | null
          weight_kg: number
          width_cm: number | null
        }
        Insert: {
          actual_delivery?: string | null
          base_price: number
          carrier_id?: string | null
          carrier_name: string
          codigo_coleta?: string | null
          comissao_logimarket_perc?: number | null
          comissao_logimarket_val?: number | null
          commission_applied: number
          created_at?: string
          current_latitude?: number | null
          current_longitude?: number | null
          destination_address: string
          destination_cep: string
          driver_id?: string | null
          driver_name?: string | null
          driver_phone?: string | null
          estimated_delivery?: string | null
          external_tracking_code?: string | null
          final_price: number
          gateway_transaction_id?: string | null
          height_cm?: number | null
          id?: string
          last_location_update?: string | null
          length_cm?: number | null
          operational_notes?: string | null
          origin_address: string
          origin_cep: string
          paid_at?: string | null
          payment_method?: string | null
          quote_id?: string | null
          repasse_data_limite?: string | null
          service_type: string
          status?: string
          status_pagamento?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          tracking_code: string
          updated_at?: string
          user_id: string
          validado_em?: string | null
          validado_para_coleta?: boolean | null
          validado_por_email?: string | null
          validado_por_nome?: string | null
          valor_repasse_liquido?: number | null
          vehicle_type?: string | null
          weight_kg: number
          width_cm?: number | null
        }
        Update: {
          actual_delivery?: string | null
          base_price?: number
          carrier_id?: string | null
          carrier_name?: string
          codigo_coleta?: string | null
          comissao_logimarket_perc?: number | null
          comissao_logimarket_val?: number | null
          commission_applied?: number
          created_at?: string
          current_latitude?: number | null
          current_longitude?: number | null
          destination_address?: string
          destination_cep?: string
          driver_id?: string | null
          driver_name?: string | null
          driver_phone?: string | null
          estimated_delivery?: string | null
          external_tracking_code?: string | null
          final_price?: number
          gateway_transaction_id?: string | null
          height_cm?: number | null
          id?: string
          last_location_update?: string | null
          length_cm?: number | null
          operational_notes?: string | null
          origin_address?: string
          origin_cep?: string
          paid_at?: string | null
          payment_method?: string | null
          quote_id?: string | null
          repasse_data_limite?: string | null
          service_type?: string
          status?: string
          status_pagamento?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          tracking_code?: string
          updated_at?: string
          user_id?: string
          validado_em?: string | null
          validado_para_coleta?: boolean | null
          validado_por_email?: string | null
          validado_por_nome?: string | null
          valor_repasse_liquido?: number | null
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
            foreignKeyName: "orders_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "driver_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "vw_pedidos_para_repasse"
            referencedColumns: ["driver_profile_id"]
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
          {
            foreignKeyName: "tracking_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "vw_pedidos_para_repasse"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      vw_logimarket_kpis_current: {
        Row: {
          faturamento_logimarket: number | null
          gmv_total: number | null
          margem_media: number | null
          pedidos_concluidos: number | null
          total_repassado: number | null
        }
        Relationships: []
      }
      vw_logimarket_performance: {
        Row: {
          faturamento_liquido_logimarket: number | null
          gmv_vendas_brutas: number | null
          media_comissao_aplicada: number | null
          month_year: string | null
          total_pedidos: number | null
          total_repasse_motorista: number | null
        }
        Relationships: []
      }
      vw_logimind_dashboard_kpis: {
        Row: {
          kpi1_comissao_media: number | null
          kpi1_take_rate_retorno: number | null
          kpi1_total_fretes: number | null
          kpi2_crescimento_volume: number | null
          kpi2_fretes_atual: number | null
          kpi2_gmv_atual: number | null
          kpi3_arpf: number | null
          kpi3_taxa_adesao: number | null
        }
        Relationships: []
      }
      vw_logimind_kpi_logiguard_pro: {
        Row: {
          arpf_logiguard: number | null
          fretes_alto_risco: number | null
          fretes_alto_valor: number | null
          fretes_com_logiguard: number | null
          fretes_elegiveis_total: number | null
          receita_total_logiguard: number | null
          taxa_adesao_perc: number | null
        }
        Relationships: []
      }
      vw_logimind_kpi_margem_retorno: {
        Row: {
          comissao_media_perc: number | null
          comissao_total_retorno: number | null
          gmv_rotas_retorno: number | null
          take_rate_medio_retorno: number | null
          total_fretes_retorno: number | null
        }
        Relationships: []
      }
      vw_logimind_kpi_volume_alta_demanda: {
        Row: {
          crescimento_gmv_perc: number | null
          crescimento_volume_perc: number | null
          fretes_anterior: number | null
          fretes_atual: number | null
          gmv_anterior: number | null
          gmv_atual: number | null
        }
        Relationships: []
      }
      vw_pedidos_para_repasse: {
        Row: {
          bank_account_number: string | null
          bank_name: string | null
          comissao_logimarket_val: number | null
          created_at: string | null
          driver_id: string | null
          driver_profile_id: string | null
          final_price: number | null
          id: string | null
          motorista_nome: string | null
          pix_key: string | null
          pix_key_type: string | null
          prioridade: string | null
          repasse_data_limite: string | null
          tracking_code: string | null
          updated_at: string | null
          valor_repasse_liquido: number | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "driver_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "vw_pedidos_para_repasse"
            referencedColumns: ["driver_profile_id"]
          },
        ]
      }
    }
    Functions: {
      generate_codigo_coleta: { Args: never; Returns: string }
      get_logimarket_kpis_current: {
        Args: never
        Returns: {
          faturamento_logimarket: number
          gmv_total: number
          margem_media: number
          pedidos_concluidos: number
          total_repassado: number
        }[]
      }
      get_logimarket_performance: {
        Args: never
        Returns: {
          faturamento_liquido_logimarket: number
          gmv_vendas_brutas: number
          media_comissao_aplicada: number
          month_year: string
          total_pedidos: number
          total_repasse_motorista: number
        }[]
      }
      get_logimind_dashboard_kpis: {
        Args: never
        Returns: {
          kpi1_comissao_media: number
          kpi1_take_rate_retorno: number
          kpi1_total_fretes: number
          kpi2_crescimento_volume: number
          kpi2_fretes_atual: number
          kpi2_gmv_atual: number
          kpi3_arpf: number
          kpi3_taxa_adesao: number
        }[]
      }
      get_pedidos_para_repasse: {
        Args: never
        Returns: {
          bank_account_number: string
          bank_name: string
          comissao_logimarket_val: number
          created_at: string
          driver_id: string
          driver_profile_id: string
          final_price: number
          id: string
          motorista_nome: string
          pix_key: string
          pix_key_type: string
          prioridade: string
          repasse_data_limite: string
          tracking_code: string
          updated_at: string
          valor_repasse_liquido: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "driver" | "user"
      cnh_category: "A" | "B" | "C" | "D" | "E" | "AB" | "AC" | "AD" | "AE"
      driver_status: "pending" | "approved" | "rejected" | "suspended"
      transaction_status: "PENDING" | "HELD" | "PAID" | "FAILED" | "REFUNDED"
      transaction_type: "PAYMENT_IN" | "PAYMENT_OUT"
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
      app_role: ["admin", "driver", "user"],
      cnh_category: ["A", "B", "C", "D", "E", "AB", "AC", "AD", "AE"],
      driver_status: ["pending", "approved", "rejected", "suspended"],
      transaction_status: ["PENDING", "HELD", "PAID", "FAILED", "REFUNDED"],
      transaction_type: ["PAYMENT_IN", "PAYMENT_OUT"],
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
