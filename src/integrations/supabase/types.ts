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
      categorias: {
        Row: {
          id: string
          image: string | null
          nombre: string
          slug: string
          tipo: string | null
        }
        Insert: {
          id?: string
          image?: string | null
          nombre: string
          slug: string
          tipo?: string | null
        }
        Update: {
          id?: string
          image?: string | null
          nombre?: string
          slug?: string
          tipo?: string | null
        }
        Relationships: []
      }
      motorcycles: {
        Row: {
          brand: string
          condition: string
          created_at: string
          description: string | null
          id: string
          images: string[] | null
          kilometers: number
          model: string
          price: number
          title: string
          year: number
        }
        Insert: {
          brand: string
          condition?: string
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          kilometers?: number
          model: string
          price: number
          title: string
          year: number
        }
        Update: {
          brand?: string
          condition?: string
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          kilometers?: number
          model?: string
          price?: number
          title?: string
          year?: number
        }
        Relationships: []
      }
      products: {
        Row: {
          brand: string
          category: string
          cc: string[] | null
          created_at: string
          description: string | null
          free_shipping: boolean | null
          id: string
          images: string[] | null
          is_on_sale: boolean | null
          moto_fit: string[] | null
          original_price: number | null
          price: number
          sizes: string[] | null
          slug: string
          stock: number | null
          title: string
        }
        Insert: {
          brand: string
          category: string
          cc?: string[] | null
          created_at?: string
          description?: string | null
          free_shipping?: boolean | null
          id?: string
          images?: string[] | null
          is_on_sale?: boolean | null
          moto_fit?: string[] | null
          original_price?: number | null
          price: number
          sizes?: string[] | null
          slug: string
          stock?: number | null
          title: string
        }
        Update: {
          brand?: string
          category?: string
          cc?: string[] | null
          created_at?: string
          description?: string | null
          free_shipping?: boolean | null
          id?: string
          images?: string[] | null
          is_on_sale?: boolean | null
          moto_fit?: string[] | null
          original_price?: number | null
          price?: number
          sizes?: string[] | null
          slug?: string
          stock?: number | null
          title?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          full_name: string | null
          id: string
          phone: string | null
          role: string | null
          wants_newsletter: boolean | null
        }
        Insert: {
          full_name?: string | null
          id: string
          phone?: string | null
          role?: string | null
          wants_newsletter?: boolean | null
        }
        Update: {
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: string | null
          wants_newsletter?: boolean | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          home_media_type: string | null
          home_media_url: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          home_media_type?: string | null
          home_media_url?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          home_media_type?: string | null
          home_media_url?: string | null
          id?: string
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
