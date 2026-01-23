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
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          likes_count: number
          parent_id: string | null
          post_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          likes_count?: number
          parent_id?: string | null
          post_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          likes_count?: number
          parent_id?: string | null
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string
          last_read_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      insurance_claims: {
        Row: {
          claim_amount: number | null
          claim_number: string
          created_at: string
          description: string
          id: string
          policy_id: string
          resolved_at: string | null
          status: string
          submitted_at: string
          user_id: string
        }
        Insert: {
          claim_amount?: number | null
          claim_number: string
          created_at?: string
          description: string
          id?: string
          policy_id: string
          resolved_at?: string | null
          status?: string
          submitted_at?: string
          user_id: string
        }
        Update: {
          claim_amount?: number | null
          claim_number?: string
          created_at?: string
          description?: string
          id?: string
          policy_id?: string
          resolved_at?: string | null
          status?: string
          submitted_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "insurance_claims_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "insurance_policies"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_companies: {
        Row: {
          created_at: string
          id: string
          is_verified: boolean | null
          logo_url: string | null
          name: string
          rating: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_verified?: boolean | null
          logo_url?: string | null
          name: string
          rating?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          is_verified?: boolean | null
          logo_url?: string | null
          name?: string
          rating?: number | null
        }
        Relationships: []
      }
      insurance_policies: {
        Row: {
          created_at: string
          document_url: string | null
          end_date: string
          id: string
          insured_email: string | null
          insured_name: string
          insured_phone: string | null
          paid_at: string | null
          policy_number: string
          premium_amount: number
          product_id: string
          start_date: string
          status: Database["public"]["Enums"]["policy_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_url?: string | null
          end_date: string
          id?: string
          insured_email?: string | null
          insured_name: string
          insured_phone?: string | null
          paid_at?: string | null
          policy_number: string
          premium_amount: number
          product_id: string
          start_date: string
          status?: Database["public"]["Enums"]["policy_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          document_url?: string | null
          end_date?: string
          id?: string
          insured_email?: string | null
          insured_name?: string
          insured_phone?: string | null
          paid_at?: string | null
          policy_number?: string
          premium_amount?: number
          product_id?: string
          start_date?: string
          status?: Database["public"]["Enums"]["policy_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "insurance_policies_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "insurance_products"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_products: {
        Row: {
          badge: string | null
          category: Database["public"]["Enums"]["insurance_category"]
          company_id: string
          coverage_amount: number | null
          created_at: string
          description: string | null
          features: Json | null
          id: string
          is_popular: boolean | null
          name: string
          price_from: number
          updated_at: string
        }
        Insert: {
          badge?: string | null
          category: Database["public"]["Enums"]["insurance_category"]
          company_id: string
          coverage_amount?: number | null
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_popular?: boolean | null
          name: string
          price_from: number
          updated_at?: string
        }
        Update: {
          badge?: string | null
          category?: Database["public"]["Enums"]["insurance_category"]
          company_id?: string
          coverage_amount?: number | null
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_popular?: boolean | null
          name?: string
          price_from?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "insurance_products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "insurance_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
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
        ]
      }
      post_media: {
        Row: {
          created_at: string
          id: string
          media_type: string
          media_url: string
          post_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          media_type?: string
          media_url: string
          post_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          media_type?: string
          media_url?: string
          post_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "post_media_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_views: {
        Row: {
          id: string
          post_id: string
          session_id: string | null
          user_id: string | null
          viewed_at: string
        }
        Insert: {
          id?: string
          post_id: string
          session_id?: string | null
          user_id?: string | null
          viewed_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          session_id?: string | null
          user_id?: string | null
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_views_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          comments_count: number
          content: string | null
          created_at: string
          id: string
          is_published: boolean
          likes_count: number
          shares_count: number
          updated_at: string
          views_count: number
        }
        Insert: {
          author_id: string
          comments_count?: number
          content?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          likes_count?: number
          shares_count?: number
          updated_at?: string
          views_count?: number
        }
        Update: {
          author_id?: string
          comments_count?: number
          content?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          likes_count?: number
          shares_count?: number
          updated_at?: string
          views_count?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string | null
          area_kitchen: number | null
          area_living: number | null
          area_total: number | null
          city: string
          created_at: string
          currency: string
          deal_type: Database["public"]["Enums"]["deal_type"]
          description: string | null
          district: string | null
          floor: number | null
          has_balcony: boolean | null
          has_furniture: boolean | null
          has_parking: boolean | null
          id: string
          is_from_owner: boolean | null
          is_new_building: boolean | null
          is_verified: boolean | null
          latitude: number | null
          longitude: number | null
          metro_station: string | null
          owner_id: string
          price: number
          property_type: Database["public"]["Enums"]["property_type"]
          rooms: number | null
          status: Database["public"]["Enums"]["property_status"]
          title: string
          total_floors: number | null
          updated_at: string
          views_count: number | null
        }
        Insert: {
          address?: string | null
          area_kitchen?: number | null
          area_living?: number | null
          area_total?: number | null
          city: string
          created_at?: string
          currency?: string
          deal_type: Database["public"]["Enums"]["deal_type"]
          description?: string | null
          district?: string | null
          floor?: number | null
          has_balcony?: boolean | null
          has_furniture?: boolean | null
          has_parking?: boolean | null
          id?: string
          is_from_owner?: boolean | null
          is_new_building?: boolean | null
          is_verified?: boolean | null
          latitude?: number | null
          longitude?: number | null
          metro_station?: string | null
          owner_id: string
          price: number
          property_type: Database["public"]["Enums"]["property_type"]
          rooms?: number | null
          status?: Database["public"]["Enums"]["property_status"]
          title: string
          total_floors?: number | null
          updated_at?: string
          views_count?: number | null
        }
        Update: {
          address?: string | null
          area_kitchen?: number | null
          area_living?: number | null
          area_total?: number | null
          city?: string
          created_at?: string
          currency?: string
          deal_type?: Database["public"]["Enums"]["deal_type"]
          description?: string | null
          district?: string | null
          floor?: number | null
          has_balcony?: boolean | null
          has_furniture?: boolean | null
          has_parking?: boolean | null
          id?: string
          is_from_owner?: boolean | null
          is_new_building?: boolean | null
          is_verified?: boolean | null
          latitude?: number | null
          longitude?: number | null
          metro_station?: string | null
          owner_id?: string
          price?: number
          property_type?: Database["public"]["Enums"]["property_type"]
          rooms?: number | null
          status?: Database["public"]["Enums"]["property_status"]
          title?: string
          total_floors?: number | null
          updated_at?: string
          views_count?: number | null
        }
        Relationships: []
      }
      property_favorites: {
        Row: {
          created_at: string
          id: string
          property_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          property_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          property_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_favorites_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_images: {
        Row: {
          created_at: string
          id: string
          image_url: string
          is_primary: boolean | null
          property_id: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          is_primary?: boolean | null
          property_id: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          is_primary?: boolean | null
          property_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "property_images_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_views: {
        Row: {
          id: string
          property_id: string
          user_id: string | null
          viewed_at: string
        }
        Insert: {
          id?: string
          property_id: string
          user_id?: string | null
          viewed_at?: string
        }
        Update: {
          id?: string
          property_id?: string
          user_id?: string | null
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_views_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
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
          role?: Database["public"]["Enums"]["app_role"]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_or_create_dm: { Args: { target_user_id: string }; Returns: string }
      get_or_create_dm_by_display_name: {
        Args: { target_display_name: string }
        Returns: string
      }
      get_user_conversation_ids: {
        Args: { user_uuid: string }
        Returns: string[]
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
      app_role: "admin" | "moderator" | "user"
      deal_type: "sale" | "rent" | "daily"
      insurance_category: "auto" | "health" | "property" | "travel" | "life"
      policy_status: "pending" | "active" | "expired" | "cancelled"
      property_status: "active" | "sold" | "rented" | "inactive"
      property_type: "apartment" | "house" | "room" | "commercial" | "land"
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
      app_role: ["admin", "moderator", "user"],
      deal_type: ["sale", "rent", "daily"],
      insurance_category: ["auto", "health", "property", "travel", "life"],
      policy_status: ["pending", "active", "expired", "cancelled"],
      property_status: ["active", "sold", "rented", "inactive"],
      property_type: ["apartment", "house", "room", "commercial", "land"],
    },
  },
} as const
