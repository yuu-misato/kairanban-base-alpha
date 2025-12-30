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
      action_point_history: {
        Row: {
          action_key: string
          created_at: string | null
          id: string
          points_granted: number
          user_id: string
        }
        Insert: {
          action_key: string
          created_at?: string | null
          id?: string
          points_granted: number
          user_id: string
        }
        Update: {
          action_key?: string
          created_at?: string | null
          id?: string
          points_granted?: number
          user_id?: string
        }
        Relationships: []
      }
      action_point_settings: {
        Row: {
          action_key: string
          action_name: string
          category: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          is_one_time: boolean | null
          points_amount: number
          updated_at: string | null
        }
        Insert: {
          action_key: string
          action_name: string
          category?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          is_one_time?: boolean | null
          points_amount?: number
          updated_at?: string | null
        }
        Update: {
          action_key?: string
          action_name?: string
          category?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          is_one_time?: boolean | null
          points_amount?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      affiliate_coupon_claims: {
        Row: {
          affiliate_id: string
          claimed_at: string | null
          coupon_code: string
          coupon_id: string
          expires_at: string
          id: string
          points_used: number
          status: string
          used_at: string | null
        }
        Insert: {
          affiliate_id: string
          claimed_at?: string | null
          coupon_code: string
          coupon_id: string
          expires_at: string
          id?: string
          points_used: number
          status?: string
          used_at?: string | null
        }
        Update: {
          affiliate_id?: string
          claimed_at?: string | null
          coupon_code?: string
          coupon_id?: string
          expires_at?: string
          id?: string
          points_used?: number
          status?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_coupon_claims_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_coupon_claims_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "partner_coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_payouts: {
        Row: {
          affiliate_id: string
          created_at: string | null
          id: string
          notes: string | null
          paid_at: string | null
          period_end: string
          period_start: string
          status: string
          total_amount: number
          total_conversions: number
        }
        Insert: {
          affiliate_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          period_end: string
          period_start: string
          status?: string
          total_amount?: number
          total_conversions?: number
        }
        Update: {
          affiliate_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          period_end?: string
          period_start?: string
          status?: string
          total_amount?: number
          total_conversions?: number
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_payouts_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_point_transactions: {
        Row: {
          affiliate_id: string
          amount: number
          balance_after: number
          created_at: string | null
          description: string | null
          id: string
          reference_id: string | null
          transaction_type: string
        }
        Insert: {
          affiliate_id: string
          amount: number
          balance_after: number
          created_at?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          transaction_type: string
        }
        Update: {
          affiliate_id?: string
          amount?: number
          balance_after?: number
          created_at?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_point_transactions_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_points: {
        Row: {
          affiliate_id: string
          balance: number
          created_at: string | null
          id: string
          total_earned: number
          total_used: number
          total_withdrawn: number
          updated_at: string | null
        }
        Insert: {
          affiliate_id: string
          balance?: number
          created_at?: string | null
          id?: string
          total_earned?: number
          total_used?: number
          total_withdrawn?: number
          updated_at?: string | null
        }
        Update: {
          affiliate_id?: string
          balance?: number
          created_at?: string | null
          id?: string
          total_earned?: number
          total_used?: number
          total_withdrawn?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_points_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: true
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_referrals: {
        Row: {
          affiliate_id: string
          commission_amount: number | null
          converted_at: string | null
          created_at: string | null
          id: string
          paid_at: string | null
          plan_amount: number | null
          referred_user_id: string
          registered_at: string | null
          source_id: string | null
          source_type: string
          status: string
        }
        Insert: {
          affiliate_id: string
          commission_amount?: number | null
          converted_at?: string | null
          created_at?: string | null
          id?: string
          paid_at?: string | null
          plan_amount?: number | null
          referred_user_id: string
          registered_at?: string | null
          source_id?: string | null
          source_type?: string
          status?: string
        }
        Update: {
          affiliate_id?: string
          commission_amount?: number | null
          converted_at?: string | null
          created_at?: string | null
          id?: string
          paid_at?: string | null
          plan_amount?: number | null
          referred_user_id?: string
          registered_at?: string | null
          source_id?: string | null
          source_type?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_referrals_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_withdrawal_requests: {
        Row: {
          account_holder: string | null
          account_number: string | null
          account_type: string | null
          admin_notes: string | null
          affiliate_id: string
          bank_name: string | null
          branch_name: string | null
          created_at: string | null
          id: string
          points_amount: number
          processed_at: string | null
          processed_by: string | null
          status: string
          updated_at: string | null
          yen_amount: number
        }
        Insert: {
          account_holder?: string | null
          account_number?: string | null
          account_type?: string | null
          admin_notes?: string | null
          affiliate_id: string
          bank_name?: string | null
          branch_name?: string | null
          created_at?: string | null
          id?: string
          points_amount: number
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          updated_at?: string | null
          yen_amount: number
        }
        Update: {
          account_holder?: string | null
          account_number?: string | null
          account_type?: string | null
          admin_notes?: string | null
          affiliate_id?: string
          bank_name?: string | null
          branch_name?: string | null
          created_at?: string | null
          id?: string
          points_amount?: number
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          updated_at?: string | null
          yen_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_withdrawal_requests_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliates: {
        Row: {
          affiliate_code: string
          approved_at: string | null
          approved_by: string | null
          commission_rate: number
          created_at: string | null
          id: string
          notes: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          affiliate_code: string
          approved_at?: string | null
          approved_by?: string | null
          commission_rate?: number
          created_at?: string | null
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          affiliate_code?: string
          approved_at?: string | null
          approved_by?: string | null
          commission_rate?: number
          created_at?: string | null
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_chat_conversations: {
        Row: {
          created_at: string
          escalated_at: string | null
          escalation_reason: string | null
          id: string
          messages: Json
          status: string
          updated_at: string
          user_email: string | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          created_at?: string
          escalated_at?: string | null
          escalation_reason?: string | null
          id?: string
          messages?: Json
          status?: string
          updated_at?: string
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          created_at?: string
          escalated_at?: string | null
          escalation_reason?: string | null
          id?: string
          messages?: Json
          status?: string
          updated_at?: string
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
      announcements: {
        Row: {
          content: string
          created_at: string
          id: string
          is_published: boolean
          published_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_published?: boolean
          published_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_published?: boolean
          published_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      ashibakai_member_roster: {
        Row: {
          company_name: string
          created_at: string
          id: string
          is_active: boolean
          notes: string | null
          updated_at: string
        }
        Insert: {
          company_name: string
          created_at?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          updated_at?: string
        }
        Update: {
          company_name?: string
          created_at?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ashibakai_memberships: {
        Row: {
          applied_at: string | null
          approved_at: string | null
          approved_by: string | null
          company_name_at_application: string | null
          created_at: string | null
          id: string
          rejection_reason: string | null
          roster_matched: boolean | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          applied_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          company_name_at_application?: string | null
          created_at?: string | null
          id?: string
          rejection_reason?: string | null
          roster_matched?: boolean | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          applied_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          company_name_at_application?: string | null
          created_at?: string | null
          id?: string
          rejection_reason?: string | null
          roster_matched?: boolean | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      blacklist_companies: {
        Row: {
          address: string | null
          company_name: string
          created_at: string
          description: string
          id: string
          phone: string | null
          prefecture: string | null
          reported_by: string | null
          representative: string | null
          risk_type: string
          status: string
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          address?: string | null
          company_name: string
          created_at?: string
          description: string
          id?: string
          phone?: string | null
          prefecture?: string | null
          reported_by?: string | null
          representative?: string | null
          risk_type: string
          status?: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          address?: string | null
          company_name?: string
          created_at?: string
          description?: string
          id?: string
          phone?: string | null
          prefecture?: string | null
          reported_by?: string | null
          representative?: string | null
          risk_type?: string
          status?: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      blacklist_reports: {
        Row: {
          admin_notes: string | null
          blacklist_id: string | null
          company_name: string
          created_at: string
          description: string
          id: string
          is_anonymous: boolean | null
          processed_at: string | null
          processed_by: string | null
          reporter_id: string
          risk_type: string
          status: string
        }
        Insert: {
          admin_notes?: string | null
          blacklist_id?: string | null
          company_name: string
          created_at?: string
          description: string
          id?: string
          is_anonymous?: boolean | null
          processed_at?: string | null
          processed_by?: string | null
          reporter_id: string
          risk_type: string
          status?: string
        }
        Update: {
          admin_notes?: string | null
          blacklist_id?: string | null
          company_name?: string
          created_at?: string
          description?: string
          id?: string
          is_anonymous?: boolean | null
          processed_at?: string | null
          processed_by?: string | null
          reporter_id?: string
          risk_type?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "blacklist_reports_blacklist_id_fkey"
            columns: ["blacklist_id"]
            isOneToOne: false
            referencedRelation: "blacklist_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      client_profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          company_description: string | null
          company_name: string
          created_at: string | null
          email: string
          id: string
          is_individual: boolean | null
          mobile_phone: string | null
          phone: string | null
          postal_code: string | null
          prefecture: string | null
          representative: string | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          company_description?: string | null
          company_name: string
          created_at?: string | null
          email: string
          id: string
          is_individual?: boolean | null
          mobile_phone?: string | null
          phone?: string | null
          postal_code?: string | null
          prefecture?: string | null
          representative?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          company_description?: string | null
          company_name?: string
          created_at?: string | null
          email?: string
          id?: string
          is_individual?: boolean | null
          mobile_phone?: string | null
          phone?: string | null
          postal_code?: string | null
          prefecture?: string | null
          representative?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          category: string | null
          created_at: string | null
          email: string
          id: string
          is_read: boolean | null
          message: string
          name: string
          subject: string
          user_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          email: string
          id?: string
          is_read?: boolean | null
          message: string
          name: string
          subject: string
          user_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          email?: string
          id?: string
          is_read?: boolean | null
          message?: string
          name?: string
          subject?: string
          user_id?: string | null
        }
        Relationships: []
      }
      contractor_listings: {
        Row: {
          available_from: string | null
          available_to: string | null
          budget_max: number | null
          budget_min: number | null
          construction_types: string[] | null
          contractor_id: string
          created_at: string | null
          description: string | null
          id: string
          publication_status: string | null
          service_areas: string[] | null
          title: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          available_from?: string | null
          available_to?: string | null
          budget_max?: number | null
          budget_min?: number | null
          construction_types?: string[] | null
          contractor_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          publication_status?: string | null
          service_areas?: string[] | null
          title: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          available_from?: string | null
          available_to?: string | null
          budget_max?: number | null
          budget_min?: number | null
          construction_types?: string[] | null
          contractor_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          publication_status?: string | null
          service_areas?: string[] | null
          title?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      contractor_profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          capital: string | null
          certifications: string[] | null
          company_description: string | null
          company_name: string
          corporate_number: string | null
          created_at: string | null
          email: string
          employee_count: string | null
          equipment: string[] | null
          founded_year: string | null
          has_construction_permit: boolean | null
          has_invoice_support: boolean | null
          has_legal_entity: boolean | null
          has_safety_documents: boolean | null
          has_social_insurance: boolean | null
          id: string
          is_individual: boolean | null
          mobile_phone: string | null
          payment_cycle: string | null
          payment_method: string | null
          payment_method_other: string | null
          phone: string | null
          postal_code: string | null
          prefecture: string | null
          referral_code: string | null
          representative: string | null
          service_areas: string[]
          updated_at: string | null
          vehicles: string[] | null
          website_url: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          capital?: string | null
          certifications?: string[] | null
          company_description?: string | null
          company_name: string
          corporate_number?: string | null
          created_at?: string | null
          email: string
          employee_count?: string | null
          equipment?: string[] | null
          founded_year?: string | null
          has_construction_permit?: boolean | null
          has_invoice_support?: boolean | null
          has_legal_entity?: boolean | null
          has_safety_documents?: boolean | null
          has_social_insurance?: boolean | null
          id: string
          is_individual?: boolean | null
          mobile_phone?: string | null
          payment_cycle?: string | null
          payment_method?: string | null
          payment_method_other?: string | null
          phone?: string | null
          postal_code?: string | null
          prefecture?: string | null
          referral_code?: string | null
          representative?: string | null
          service_areas?: string[]
          updated_at?: string | null
          vehicles?: string[] | null
          website_url?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          capital?: string | null
          certifications?: string[] | null
          company_description?: string | null
          company_name?: string
          corporate_number?: string | null
          created_at?: string | null
          email?: string
          employee_count?: string | null
          equipment?: string[] | null
          founded_year?: string | null
          has_construction_permit?: boolean | null
          has_invoice_support?: boolean | null
          has_legal_entity?: boolean | null
          has_safety_documents?: boolean | null
          has_social_insurance?: boolean | null
          id?: string
          is_individual?: boolean | null
          mobile_phone?: string | null
          payment_cycle?: string | null
          payment_method?: string | null
          payment_method_other?: string | null
          phone?: string | null
          postal_code?: string | null
          prefecture?: string | null
          referral_code?: string | null
          representative?: string | null
          service_areas?: string[]
          updated_at?: string | null
          vehicles?: string[] | null
          website_url?: string | null
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer: string
          category: string | null
          created_at: string
          display_order: number
          id: string
          is_published: boolean
          question: string
          updated_at: string
        }
        Insert: {
          answer: string
          category?: string | null
          created_at?: string
          display_order?: number
          id?: string
          is_published?: boolean
          question: string
          updated_at?: string
        }
        Update: {
          answer?: string
          category?: string | null
          created_at?: string
          display_order?: number
          id?: string
          is_published?: boolean
          question?: string
          updated_at?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string | null
          id: string
          member_id: string | null
          project_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          member_id?: string | null
          project_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          member_id?: string | null
          project_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_badges: {
        Row: {
          badge_text: string | null
          created_at: string | null
          display_order: number | null
          feature_key: string
          feature_name: string
          id: string
          is_new: boolean | null
          updated_at: string | null
        }
        Insert: {
          badge_text?: string | null
          created_at?: string | null
          display_order?: number | null
          feature_key: string
          feature_name: string
          id?: string
          is_new?: boolean | null
          updated_at?: string | null
        }
        Update: {
          badge_text?: string | null
          created_at?: string | null
          display_order?: number | null
          feature_key?: string
          feature_name?: string
          id?: string
          is_new?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      lab_features: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          feature_id: string
          icon: string
          id: string
          is_new: boolean | null
          is_published: boolean
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          feature_id: string
          icon?: string
          id?: string
          is_new?: boolean | null
          is_published?: boolean
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          feature_id?: string
          icon?: string
          id?: string
          is_new?: boolean | null
          is_published?: boolean
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      legacy_members: {
        Row: {
          address: string | null
          capital: string | null
          certifications: string[] | null
          company_description: string | null
          company_name: string | null
          company_type: string | null
          created_at: string | null
          email: string | null
          employee_count: string | null
          equipment: string[] | null
          founded_year: string | null
          has_construction_permit: boolean | null
          has_invoice_support: boolean | null
          has_safety_documents: boolean | null
          has_social_insurance: boolean | null
          id: string
          logo_image_path: string | null
          mid: string
          migrated_at: string | null
          migrated_user_id: string | null
          mobile_phone: string | null
          original_updated_at: string | null
          payment_cycle: string | null
          payment_method: string | null
          phone: string | null
          postal_code: string | null
          prefecture: string | null
          registered_at: string | null
          representative: string | null
          service_areas: string[] | null
          vehicles: string[] | null
          website_url: string | null
        }
        Insert: {
          address?: string | null
          capital?: string | null
          certifications?: string[] | null
          company_description?: string | null
          company_name?: string | null
          company_type?: string | null
          created_at?: string | null
          email?: string | null
          employee_count?: string | null
          equipment?: string[] | null
          founded_year?: string | null
          has_construction_permit?: boolean | null
          has_invoice_support?: boolean | null
          has_safety_documents?: boolean | null
          has_social_insurance?: boolean | null
          id?: string
          logo_image_path?: string | null
          mid: string
          migrated_at?: string | null
          migrated_user_id?: string | null
          mobile_phone?: string | null
          original_updated_at?: string | null
          payment_cycle?: string | null
          payment_method?: string | null
          phone?: string | null
          postal_code?: string | null
          prefecture?: string | null
          registered_at?: string | null
          representative?: string | null
          service_areas?: string[] | null
          vehicles?: string[] | null
          website_url?: string | null
        }
        Update: {
          address?: string | null
          capital?: string | null
          certifications?: string[] | null
          company_description?: string | null
          company_name?: string | null
          company_type?: string | null
          created_at?: string | null
          email?: string | null
          employee_count?: string | null
          equipment?: string[] | null
          founded_year?: string | null
          has_construction_permit?: boolean | null
          has_invoice_support?: boolean | null
          has_safety_documents?: boolean | null
          has_social_insurance?: boolean | null
          id?: string
          logo_image_path?: string | null
          mid?: string
          migrated_at?: string | null
          migrated_user_id?: string | null
          mobile_phone?: string | null
          original_updated_at?: string | null
          payment_cycle?: string | null
          payment_method?: string | null
          phone?: string | null
          postal_code?: string | null
          prefecture?: string | null
          registered_at?: string | null
          representative?: string | null
          service_areas?: string[] | null
          vehicles?: string[] | null
          website_url?: string | null
        }
        Relationships: []
      }
      line_accounts: {
        Row: {
          display_name: string | null
          id: string
          is_notification_enabled: boolean | null
          line_user_id: string
          linked_at: string | null
          picture_url: string | null
          status_message: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          display_name?: string | null
          id?: string
          is_notification_enabled?: boolean | null
          line_user_id: string
          linked_at?: string | null
          picture_url?: string | null
          status_message?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          display_name?: string | null
          id?: string
          is_notification_enabled?: boolean | null
          line_user_id?: string
          linked_at?: string | null
          picture_url?: string | null
          status_message?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      line_link_codes: {
        Row: {
          code: string
          created_at: string | null
          display_name: string | null
          expires_at: string
          id: string
          line_user_id: string
          picture_url: string | null
          used_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          display_name?: string | null
          expires_at: string
          id?: string
          line_user_id: string
          picture_url?: string | null
          used_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          display_name?: string | null
          expires_at?: string
          id?: string
          line_user_id?: string
          picture_url?: string | null
          used_at?: string | null
        }
        Relationships: []
      }
      line_notification_settings: {
        Row: {
          announcement: boolean | null
          application_result: boolean | null
          created_at: string | null
          id: string
          new_application: boolean | null
          new_follower: boolean | null
          new_message: boolean | null
          new_project_in_area: boolean | null
          new_review: boolean | null
          project_update: boolean | null
          updated_at: string | null
          user_id: string
          work_request: boolean | null
          quiet_hours_enabled: boolean | null
          quiet_hours_start: string | null
          quiet_hours_end: string | null
        }
        Insert: {
          announcement?: boolean | null
          application_result?: boolean | null
          created_at?: string | null
          id?: string
          new_application?: boolean | null
          new_follower?: boolean | null
          new_message?: boolean | null
          new_project_in_area?: boolean | null
          new_review?: boolean | null
          project_update?: boolean | null
          updated_at?: string | null
          user_id: string
          work_request?: boolean | null
          quiet_hours_enabled?: boolean | null
          quiet_hours_start?: string | null
          quiet_hours_end?: string | null
        }
        Update: {
          announcement?: boolean | null
          application_result?: boolean | null
          created_at?: string | null
          id?: string
          new_application?: boolean | null
          new_follower?: boolean | null
          new_message?: boolean | null
          new_project_in_area?: boolean | null
          new_review?: boolean | null
          project_update?: boolean | null
          updated_at?: string | null
          user_id?: string
          work_request?: boolean | null
          quiet_hours_enabled?: boolean | null
          quiet_hours_start?: string | null
          quiet_hours_end?: string | null
        }
        Relationships: []
      }
      line_notification_templates: {
        Row: {
          available_variables: string[] | null
          body_template: string
          button_label: string | null
          created_at: string | null
          emoji: string | null
          id: string
          include_url_button: boolean | null
          is_enabled: boolean | null
          name: string
          notification_type: string
          title_template: string
          updated_at: string | null
        }
        Insert: {
          available_variables?: string[] | null
          body_template: string
          button_label?: string | null
          created_at?: string | null
          emoji?: string | null
          id?: string
          include_url_button?: boolean | null
          is_enabled?: boolean | null
          name: string
          notification_type: string
          title_template: string
          updated_at?: string | null
        }
        Update: {
          available_variables?: string[] | null
          body_template?: string
          button_label?: string | null
          created_at?: string | null
          emoji?: string | null
          id?: string
          include_url_button?: boolean | null
          is_enabled?: boolean | null
          name?: string
          notification_type?: string
          title_template?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_read: boolean | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          link: string | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      partner_banners: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          gradient_from: string
          gradient_to: string
          id: string
          image_url: string | null
          is_active: boolean
          title: string
          updated_at: string
          url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          gradient_from?: string
          gradient_to?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          title: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          gradient_from?: string
          gradient_to?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          title?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      partner_coupons: {
        Row: {
          created_at: string | null
          description: string | null
          discount_type: string
          discount_value: number
          display_order: number | null
          id: string
          is_active: boolean
          max_claims: number | null
          name: string
          partner_banner_id: string | null
          partner_service_id: string | null
          points_required: number
          updated_at: string | null
          valid_days: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          discount_type?: string
          discount_value: number
          display_order?: number | null
          id?: string
          is_active?: boolean
          max_claims?: number | null
          name: string
          partner_banner_id?: string | null
          partner_service_id?: string | null
          points_required: number
          updated_at?: string | null
          valid_days?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          display_order?: number | null
          id?: string
          is_active?: boolean
          max_claims?: number | null
          name?: string
          partner_banner_id?: string | null
          partner_service_id?: string | null
          points_required?: number
          updated_at?: string | null
          valid_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_coupons_partner_banner_id_fkey"
            columns: ["partner_banner_id"]
            isOneToOne: false
            referencedRelation: "partner_banners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_coupons_partner_service_id_fkey"
            columns: ["partner_service_id"]
            isOneToOne: false
            referencedRelation: "partner_services"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_services: {
        Row: {
          created_at: string
          display_order: number
          icon_name: string
          id: string
          is_active: boolean
          title: string
          updated_at: string
          url: string | null
        }
        Insert: {
          created_at?: string
          display_order?: number
          icon_name?: string
          id?: string
          is_active?: boolean
          title: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          created_at?: string
          display_order?: number
          icon_name?: string
          id?: string
          is_active?: boolean
          title?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      point_expiry_settings: {
        Row: {
          created_at: string | null
          expiry_months: number
          id: string
          is_active: boolean | null
          notify_days_before: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          expiry_months?: number
          id?: string
          is_active?: boolean | null
          notify_days_before?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          expiry_months?: number
          id?: string
          is_active?: boolean | null
          notify_days_before?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      project_applications: {
        Row: {
          completed_at: string | null
          contractor_id: string
          created_at: string | null
          delivered_at: string | null
          delivery_message: string | null
          id: string
          message: string | null
          project_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          contractor_id: string
          created_at?: string | null
          delivered_at?: string | null
          delivery_message?: string | null
          id?: string
          message?: string | null
          project_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          contractor_id?: string
          created_at?: string | null
          delivered_at?: string | null
          delivery_message?: string | null
          id?: string
          message?: string | null
          project_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_applications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_notes: {
        Row: {
          content: string
          created_at: string
          id: string
          project_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          project_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          project_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_notes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_templates: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          is_default: boolean | null
          name: string
          template_data: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          template_data?: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          template_data?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          application_deadline: string
          budget_amount: number | null
          budget_negotiable: boolean | null
          city: string | null
          client_id: string
          construction_type: string
          created_at: string | null
          description: string | null
          id: string
          payment_cycle: string | null
          payment_method: string | null
          prefecture: string
          publication_deadline: string
          publication_status: string
          requires_construction_permit: boolean | null
          requires_invoice_support: boolean | null
          requires_legal_entity: boolean | null
          service_areas: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          view_count: number | null
          work_end_date: string | null
          work_period_negotiable: boolean | null
          work_start_date: string | null
        }
        Insert: {
          application_deadline: string
          budget_amount?: number | null
          budget_negotiable?: boolean | null
          city?: string | null
          client_id: string
          construction_type: string
          created_at?: string | null
          description?: string | null
          id?: string
          payment_cycle?: string | null
          payment_method?: string | null
          prefecture: string
          publication_deadline: string
          publication_status?: string
          requires_construction_permit?: boolean | null
          requires_invoice_support?: boolean | null
          requires_legal_entity?: boolean | null
          service_areas?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          view_count?: number | null
          work_end_date?: string | null
          work_period_negotiable?: boolean | null
          work_start_date?: string | null
        }
        Update: {
          application_deadline?: string
          budget_amount?: number | null
          budget_negotiable?: boolean | null
          city?: string | null
          client_id?: string
          construction_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          payment_cycle?: string | null
          payment_method?: string | null
          prefecture?: string
          publication_deadline?: string
          publication_status?: string
          requires_construction_permit?: boolean | null
          requires_invoice_support?: boolean | null
          requires_legal_entity?: boolean | null
          service_areas?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          view_count?: number | null
          work_end_date?: string | null
          work_period_negotiable?: boolean | null
          work_start_date?: string | null
        }
        Relationships: []
      }
      quick_reply_templates: {
        Row: {
          content: string
          created_at: string | null
          display_order: number | null
          id: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      referral_code_uses: {
        Row: {
          created_at: string | null
          id: string
          points_granted: number
          referral_code_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          points_granted: number
          referral_code_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          points_granted?: number
          referral_code_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_code_uses_referral_code_id_fkey"
            columns: ["referral_code_id"]
            isOneToOne: false
            referencedRelation: "referral_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string | null
          created_by: string | null
          current_uses: number | null
          description: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          points_amount: number
          updated_at: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          created_by?: string | null
          current_uses?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          points_amount: number
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          created_by?: string | null
          current_uses?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          points_amount?: number
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string | null
          id: string
          referral_code: string
          referred_id: string
          referrer_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          referral_code: string
          referred_id: string
          referrer_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          referral_code?: string
          referred_id?: string
          referrer_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          application_id: string | null
          comment: string | null
          created_at: string
          id: string
          rating: number
          reviewer_id: string
          reviewer_type: string | null
          target_id: string
          updated_at: string
        }
        Insert: {
          application_id?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          reviewer_id: string
          reviewer_type?: string | null
          target_id: string
          updated_at?: string
        }
        Update: {
          application_id?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          reviewer_id?: string
          reviewer_type?: string | null
          target_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "project_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      usage_addons: {
        Row: {
          addon_type: string
          created_at: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          price: number
          quantity: number
          updated_at: string | null
        }
        Insert: {
          addon_type: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          price: number
          quantity: number
          updated_at?: string | null
        }
        Update: {
          addon_type?: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          quantity?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      usage_limits: {
        Row: {
          action_limit: number | null
          application_limit: number
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          message_limit: number
          plan_type: string
          price: number | null
          project_limit: number
          updated_at: string | null
        }
        Insert: {
          action_limit?: number | null
          application_limit?: number
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          message_limit?: number
          plan_type: string
          price?: number | null
          project_limit?: number
          updated_at?: string | null
        }
        Update: {
          action_limit?: number | null
          application_limit?: number
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          message_limit?: number
          plan_type?: string
          price?: number | null
          project_limit?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      user_addon_purchases: {
        Row: {
          addon_id: string | null
          addon_type: string
          created_at: string | null
          expires_at: string | null
          id: string
          purchased_at: string | null
          quantity: number
          remaining: number
          user_id: string
        }
        Insert: {
          addon_id?: string | null
          addon_type: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          purchased_at?: string | null
          quantity: number
          remaining: number
          user_id: string
        }
        Update: {
          addon_id?: string | null
          addon_type?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          purchased_at?: string | null
          quantity?: number
          remaining?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_addon_purchases_addon_id_fkey"
            columns: ["addon_id"]
            isOneToOne: false
            referencedRelation: "usage_addons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_coupon_claims: {
        Row: {
          claimed_at: string | null
          coupon_code: string
          coupon_id: string
          created_at: string | null
          expires_at: string
          id: string
          points_used: number
          status: string
          updated_at: string | null
          used_at: string | null
          user_id: string
        }
        Insert: {
          claimed_at?: string | null
          coupon_code: string
          coupon_id: string
          created_at?: string | null
          expires_at: string
          id?: string
          points_used: number
          status?: string
          updated_at?: string | null
          used_at?: string | null
          user_id: string
        }
        Update: {
          claimed_at?: string | null
          coupon_code?: string
          coupon_id?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          points_used?: number
          status?: string
          updated_at?: string | null
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_coupon_claims_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "partner_coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_plans: {
        Row: {
          created_at: string | null
          expires_at: string | null
          granted_at: string | null
          granted_by: string | null
          id: string
          notes: string | null
          plan_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          notes?: string | null
          plan_type?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          notes?: string | null
          plan_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_point_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string | null
          description: string | null
          expired_at: string | null
          expires_at: string | null
          granted_by: string | null
          id: string
          reference_id: string | null
          remaining_amount: number | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string | null
          description?: string | null
          expired_at?: string | null
          expires_at?: string | null
          granted_by?: string | null
          id?: string
          reference_id?: string | null
          remaining_amount?: number | null
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string | null
          description?: string | null
          expired_at?: string | null
          expires_at?: string | null
          granted_by?: string | null
          id?: string
          reference_id?: string | null
          remaining_amount?: number | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_points: {
        Row: {
          balance: number
          created_at: string | null
          id: string
          total_earned: number
          total_used: number
          total_withdrawn: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string | null
          id?: string
          total_earned?: number
          total_used?: number
          total_withdrawn?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string | null
          id?: string
          total_earned?: number
          total_used?: number
          total_withdrawn?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_withdrawal_requests: {
        Row: {
          account_holder: string | null
          account_number: string | null
          account_type: string | null
          admin_notes: string | null
          bank_name: string | null
          branch_name: string | null
          created_at: string | null
          id: string
          points_amount: number
          processed_at: string | null
          processed_by: string | null
          status: string
          updated_at: string | null
          user_id: string
          yen_amount: number
        }
        Insert: {
          account_holder?: string | null
          account_number?: string | null
          account_type?: string | null
          admin_notes?: string | null
          bank_name?: string | null
          branch_name?: string | null
          created_at?: string | null
          id?: string
          points_amount: number
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
          yen_amount: number
        }
        Update: {
          account_holder?: string | null
          account_number?: string | null
          account_type?: string | null
          admin_notes?: string | null
          bank_name?: string | null
          branch_name?: string | null
          created_at?: string | null
          id?: string
          points_amount?: number
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
          yen_amount?: number
        }
        Relationships: []
      }
      withdrawal_logs: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          reason: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          reason?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          reason?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      work_requests: {
        Row: {
          created_at: string
          id: string
          message: string
          requester_id: string
          status: string
          target_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          requester_id: string
          status?: string
          target_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          requester_id?: string
          status?: string
          target_id?: string
          title?: string
          updated_at?: string
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
      app_role: "client" | "contractor" | "admin"
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
      app_role: ["client", "contractor", "admin"],
    },
  },
} as const
