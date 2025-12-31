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
      comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      communities: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          invite_code: string
          is_secret: boolean | null
          members_count: number | null
          name: string
          owner_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          invite_code: string
          is_secret?: boolean | null
          members_count?: number | null
          name: string
          owner_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          invite_code?: string
          is_secret?: boolean | null
          members_count?: number | null
          name?: string
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "communities_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_members: {
        Row: {
          community_id: string | null
          id: string
          joined_at: string | null
          role: string | null
          user_id: string | null
        }
        Insert: {
          community_id?: string | null
          id?: string
          joined_at?: string | null
          role?: string | null
          user_id?: string | null
        }
        Update: {
          community_id?: string | null
          id?: string
          joined_at?: string | null
          role?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_members_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          area: string | null
          created_at: string | null
          description: string | null
          discount_rate: string | null
          id: string
          image_url: string | null
          is_public: boolean | null
          required_score: number | null
          shop_name: string | null
          title: string | null
        }
        Insert: {
          area?: string | null
          created_at?: string | null
          description?: string | null
          discount_rate?: string | null
          id?: string
          image_url?: string | null
          is_public?: boolean | null
          required_score?: number | null
          shop_name?: string | null
          title?: string | null
        }
        Update: {
          area?: string | null
          created_at?: string | null
          description?: string | null
          discount_rate?: string | null
          id?: string
          image_url?: string | null
          is_public?: boolean | null
          required_score?: number | null
          shop_name?: string | null
          title?: string | null
        }
        Relationships: []
      }
      error_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          error_name: string | null
          id: string
          stack_trace: string | null
          url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          error_name?: string | null
          id?: string
          stack_trace?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          error_name?: string | null
          id?: string
          stack_trace?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "error_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      household_members: {
        Row: {
          created_at: string | null
          household_id: string
          id: string
          nickname: string
          role: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          household_id: string
          id?: string
          nickname: string
          role?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          household_id?: string
          id?: string
          nickname?: string
          role?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "household_members_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      households: {
        Row: {
          address: string | null
          created_at: string | null
          created_by: string
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          created_by: string
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          created_by?: string
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      kairanban_reads: {
        Row: {
          household_member_id: string | null
          id: string
          kairanban_id: string
          read_at: string | null
          user_id: string | null
        }
        Insert: {
          household_member_id?: string | null
          id?: string
          kairanban_id: string
          read_at?: string | null
          user_id?: string | null
        }
        Update: {
          household_member_id?: string | null
          id?: string
          kairanban_id?: string
          read_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kairanban_reads_household_member_id_fkey"
            columns: ["household_member_id"]
            isOneToOne: false
            referencedRelation: "household_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kairanban_reads_kairanban_id_fkey"
            columns: ["kairanban_id"]
            isOneToOne: false
            referencedRelation: "kairanbans"
            referencedColumns: ["id"]
          },
        ]
      }
      kairanbans: {
        Row: {
          area: string | null
          author: string | null
          community_id: string | null
          content: string | null
          created_at: string | null
          id: string
          points: number | null
          read_count: number | null
          sent_to_line: boolean | null
          title: string | null
        }
        Insert: {
          area?: string | null
          author?: string | null
          community_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          points?: number | null
          read_count?: number | null
          sent_to_line?: boolean | null
          title?: string | null
        }
        Update: {
          area?: string | null
          author?: string | null
          community_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          points?: number | null
          read_count?: number | null
          sent_to_line?: boolean | null
          title?: string | null
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
          quiet_hours_enabled: boolean | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          updated_at: string | null
          user_id: string
          work_request: boolean | null
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
          quiet_hours_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          updated_at?: string | null
          user_id: string
          work_request?: boolean | null
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
          quiet_hours_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          updated_at?: string | null
          user_id?: string
          work_request?: boolean | null
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
      mission_participants: {
        Row: {
          created_at: string | null
          id: string
          mission_id: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          mission_id?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          mission_id?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mission_participants_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "volunteer_missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      post_likes: {
        Row: {
          created_at: string | null
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          area: string | null
          author_id: string
          category: string | null
          content: string
          created_at: string | null
          fts: unknown
          id: string
          image_url: string | null
          likes: number | null
          title: string | null
        }
        Insert: {
          area?: string | null
          author_id: string
          category?: string | null
          content: string
          created_at?: string | null
          fts?: unknown
          id?: string
          image_url?: string | null
          likes?: number | null
          title?: string | null
        }
        Update: {
          area?: string | null
          author_id?: string
          category?: string | null
          content?: string
          created_at?: string | null
          fts?: unknown
          id?: string
          image_url?: string | null
          likes?: number | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          id: string
          level: number | null
          nickname: string | null
          role: string | null
          score: number | null
          selected_areas: string[] | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          id: string
          level?: number | null
          nickname?: string | null
          role?: string | null
          score?: number | null
          selected_areas?: string[] | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string
          level?: number | null
          nickname?: string | null
          role?: string | null
          score?: number | null
          selected_areas?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
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
        Relationships: []
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
      reports: {
        Row: {
          created_at: string | null
          id: string
          reason: string | null
          reporter_id: string | null
          status: string | null
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          reason?: string | null
          reporter_id?: string | null
          status?: string | null
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          reason?: string | null
          reporter_id?: string | null
          status?: string | null
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      safety_reports: {
        Row: {
          household_member_id: string | null
          id: string
          latitude: number | null
          longitude: number | null
          message: string | null
          reported_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          household_member_id?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          message?: string | null
          reported_at?: string | null
          status: string
          user_id: string
        }
        Update: {
          household_member_id?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          message?: string | null
          reported_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "safety_reports_household_member_id_fkey"
            columns: ["household_member_id"]
            isOneToOne: false
            referencedRelation: "household_members"
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
      support_tickets: {
        Row: {
          admin_note: string | null
          category: string | null
          created_at: string | null
          email: string | null
          id: string
          message: string
          status: string | null
          subject: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          admin_note?: string | null
          category?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          message: string
          status?: string | null
          subject: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          admin_note?: string | null
          category?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          message?: string
          status?: string | null
          subject?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      user_monthly_usages: {
        Row: {
          action_count: number | null
          created_at: string | null
          id: string
          message_count: number | null
          updated_at: string | null
          user_id: string
          year_month: string
        }
        Insert: {
          action_count?: number | null
          created_at?: string | null
          id?: string
          message_count?: number | null
          updated_at?: string | null
          user_id: string
          year_month: string
        }
        Update: {
          action_count?: number | null
          created_at?: string | null
          id?: string
          message_count?: number | null
          updated_at?: string | null
          user_id?: string
          year_month?: string
        }
        Relationships: []
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
      volunteer_missions: {
        Row: {
          area: string | null
          created_at: string | null
          current_participants: number | null
          date: string | null
          description: string | null
          id: string
          max_participants: number | null
          points: number | null
          title: string | null
        }
        Insert: {
          area?: string | null
          created_at?: string | null
          current_participants?: number | null
          date?: string | null
          description?: string | null
          id?: string
          max_participants?: number | null
          points?: number | null
          title?: string | null
        }
        Update: {
          area?: string | null
          created_at?: string | null
          current_participants?: number | null
          date?: string | null
          description?: string | null
          id?: string
          max_participants?: number | null
          points?: number | null
          title?: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_member_count: { Args: { c_id: string }; Returns: undefined }
      increment_points: {
        Args: { amount: number; user_id: string }
        Returns: Json
      }
      join_mission: { Args: { m_id: string; u_id: string }; Returns: boolean }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      toggle_like: { Args: { p_id: string; u_id: string }; Returns: undefined }
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
