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
      app_settings: {
        Row: {
          city: string
          company_name: string
          email: string
          id: boolean
          lawyer: string
          panel_subprefix: string
          phone: string
          resend_api_key: string
          resend_from_email: string
          resend_from_name: string
          sevenio_api_key: string
          sevenio_from_name: string
          street: string
          updated_at: string
          vat_id: string
          website: string
        }
        Insert: {
          city?: string
          company_name?: string
          email?: string
          id?: boolean
          lawyer?: string
          panel_subprefix?: string
          phone?: string
          resend_api_key?: string
          resend_from_email?: string
          resend_from_name?: string
          sevenio_api_key?: string
          sevenio_from_name?: string
          street?: string
          updated_at?: string
          vat_id?: string
          website?: string
        }
        Update: {
          city?: string
          company_name?: string
          email?: string
          id?: boolean
          lawyer?: string
          panel_subprefix?: string
          phone?: string
          resend_api_key?: string
          resend_from_email?: string
          resend_from_name?: string
          sevenio_api_key?: string
          sevenio_from_name?: string
          street?: string
          updated_at?: string
          vat_id?: string
          website?: string
        }
        Relationships: []
      }
      lead_activity: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json
          id: string
          lead_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          lead_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          lead_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_activity_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_notes: {
        Row: {
          author_id: string | null
          content: string
          created_at: string
          id: string
          lead_id: string
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string
          id?: string
          lead_id: string
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string
          id?: string
          lead_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_notes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          email: string | null
          external_id: string | null
          full_name: string | null
          id: string
          imported_at: string
          imported_by: string | null
          phone_number: string | null
          raw: Json | null
          schadenshoehe: number | null
          source: string
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
          vorfall: string | null
        }
        Insert: {
          email?: string | null
          external_id?: string | null
          full_name?: string | null
          id?: string
          imported_at?: string
          imported_by?: string | null
          phone_number?: string | null
          raw?: Json | null
          schadenshoehe?: number | null
          source?: string
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          vorfall?: string | null
        }
        Update: {
          email?: string | null
          external_id?: string | null
          full_name?: string | null
          id?: string
          imported_at?: string
          imported_by?: string | null
          phone_number?: string | null
          raw?: Json | null
          schadenshoehe?: number | null
          source?: string
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          vorfall?: string | null
        }
        Relationships: []
      }
      phone_numbers: {
        Row: {
          api_url: string
          created_at: string
          created_by: string | null
          id: string
          token: string
        }
        Insert: {
          api_url: string
          created_at?: string
          created_by?: string | null
          id?: string
          token: string
        }
        Update: {
          api_url?: string
          created_at?: string
          created_by?: string | null
          id?: string
          token?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          balance: number | null
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          id_document_submitted_at: string | null
          last_name: string | null
          phone: string | null
          scam_project: string | null
          source_lead_id: string | null
          temp_password: string | null
        }
        Insert: {
          balance?: number | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id: string
          id_document_submitted_at?: string | null
          last_name?: string | null
          phone?: string | null
          scam_project?: string | null
          source_lead_id?: string | null
          temp_password?: string | null
        }
        Update: {
          balance?: number | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          id_document_submitted_at?: string | null
          last_name?: string | null
          phone?: string | null
          scam_project?: string | null
          source_lead_id?: string | null
          temp_password?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_source_lead_id_fkey"
            columns: ["source_lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_spoof_history: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          message: string
          recipient: string
          response: Json | null
          sender_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          message: string
          recipient: string
          response?: Json | null
          sender_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          message?: string
          recipient?: string
          response?: Json | null
          sender_id?: string
        }
        Relationships: []
      }
      sms_templates: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          message: string
          sender_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          message: string
          sender_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          message?: string
          sender_id?: string
        }
        Relationships: []
      }
      sms_templates_config: {
        Row: {
          content: string
          key: string
          updated_at: string
        }
        Insert: {
          content: string
          key: string
          updated_at?: string
        }
        Update: {
          content?: string
          key?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_documents: {
        Row: {
          assignment_id: string | null
          created_at: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          kind: string
          user_id: string
        }
        Insert: {
          assignment_id?: string | null
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number
          file_type: string
          id?: string
          kind?: string
          user_id: string
        }
        Update: {
          assignment_id?: string | null
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          kind?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_documents_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "verification_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notes: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
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
      verification_assignments: {
        Row: {
          created_at: string
          created_by: string | null
          field_values: Json
          hidden_sms: Json
          id: string
          phone_number_id: string | null
          sms_monitoring_active: boolean
          status: Database["public"]["Enums"]["assignment_status"]
          user_id: string
          verification_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          field_values?: Json
          hidden_sms?: Json
          id?: string
          phone_number_id?: string | null
          sms_monitoring_active?: boolean
          status?: Database["public"]["Enums"]["assignment_status"]
          user_id: string
          verification_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          field_values?: Json
          hidden_sms?: Json
          id?: string
          phone_number_id?: string | null
          sms_monitoring_active?: boolean
          status?: Database["public"]["Enums"]["assignment_status"]
          user_id?: string
          verification_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_assignments_phone_number_id_fkey"
            columns: ["phone_number_id"]
            isOneToOne: false
            referencedRelation: "phone_numbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_assignments_verification_id_fkey"
            columns: ["verification_id"]
            isOneToOne: false
            referencedRelation: "verifications"
            referencedColumns: ["id"]
          },
        ]
      }
      verifications: {
        Row: {
          appstore_url: string | null
          created_at: string
          created_by: string | null
          id: string
          instructions: string[]
          logo_url: string | null
          playstore_url: string | null
          required_fields: string[]
          title: string
          type: string
        }
        Insert: {
          appstore_url?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          instructions?: string[]
          logo_url?: string | null
          playstore_url?: string | null
          required_fields?: string[]
          title: string
          type?: string
        }
        Update: {
          appstore_url?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          instructions?: string[]
          logo_url?: string | null
          playstore_url?: string | null
          required_fields?: string[]
          title?: string
          type?: string
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
      assignment_status:
        | "zugewiesen"
        | "in_bearbeitung"
        | "abgeschlossen"
        | "in_ueberpruefung"
        | "genehmigt"
        | "abgelehnt"
      lead_status:
        | "neu"
        | "in_bearbeitung"
        | "mailbox"
        | "fehlgeschlagen"
        | "erfolgreich"
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
      assignment_status: [
        "zugewiesen",
        "in_bearbeitung",
        "abgeschlossen",
        "in_ueberpruefung",
        "genehmigt",
        "abgelehnt",
      ],
      lead_status: [
        "neu",
        "in_bearbeitung",
        "mailbox",
        "fehlgeschlagen",
        "erfolgreich",
      ],
    },
  },
} as const
