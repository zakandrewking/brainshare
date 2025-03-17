export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      custom_type: {
        Row: {
          created_at: string
          description: string
          examples: string[]
          id: string
          kind: string
          log_scale: boolean
          max_value: number
          min_value: number
          name: string
          not_examples: string[]
          public: boolean
          rules: string[]
          updated_at: string
          user_id: string
          values_key: string | null
        }
        Insert: {
          created_at?: string
          description: string
          examples?: string[]
          id?: string
          kind: string
          log_scale?: boolean
          max_value?: number
          min_value?: number
          name: string
          not_examples?: string[]
          public?: boolean
          rules?: string[]
          updated_at?: string
          user_id: string
          values_key?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          examples?: string[]
          id?: string
          kind?: string
          log_scale?: boolean
          max_value?: number
          min_value?: number
          name?: string
          not_examples?: string[]
          public?: boolean
          rules?: string[]
          updated_at?: string
          user_id?: string
          values_key?: string | null
        }
        Relationships: []
      }
      dirty_custom_type: {
        Row: {
          id: number
          marked_at: string
          table_identification_id: number
          type_id: string
          user_id: string
        }
        Insert: {
          id?: number
          marked_at?: string
          table_identification_id: number
          type_id: string
          user_id: string
        }
        Update: {
          id?: number
          marked_at?: string
          table_identification_id?: number
          type_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dirty_custom_type_table_identification_id_fkey"
            columns: ["table_identification_id"]
            isOneToOne: false
            referencedRelation: "table_identification"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dirty_custom_type_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "custom_type"
            referencedColumns: ["id"]
          },
        ]
      }
      file: {
        Row: {
          bucket_id: string
          id: string
          latest_task_id: string | null
          mime_type: string | null
          name: string
          object_path: string
          size: number
          user_id: string
        }
        Insert: {
          bucket_id: string
          id: string
          latest_task_id?: string | null
          mime_type?: string | null
          name: string
          object_path: string
          size: number
          user_id: string
        }
        Update: {
          bucket_id?: string
          id?: string
          latest_task_id?: string | null
          mime_type?: string | null
          name?: string
          object_path?: string
          size?: number
          user_id?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          id: number
          title: string | null
          user_id: string
        }
        Insert: {
          id?: number
          title?: string | null
          user_id: string
        }
        Update: {
          id?: number
          title?: string | null
          user_id?: string
        }
        Relationships: []
      }
      table_identification: {
        Row: {
          created_at: string
          id: number
          identifications: Json
          prefixed_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          identifications: Json
          prefixed_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: number
          identifications?: Json
          prefixed_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      table_widgets: {
        Row: {
          created_at: string
          id: number
          prefixed_id: string
          updated_at: string
          user_id: string
          widgets: Json
        }
        Insert: {
          created_at?: string
          id?: number
          prefixed_id: string
          updated_at?: string
          user_id: string
          widgets: Json
        }
        Update: {
          created_at?: string
          id?: number
          prefixed_id?: string
          updated_at?: string
          user_id?: string
          widgets?: Json
        }
        Relationships: []
      }
      task_link: {
        Row: {
          id: number
          task_created_at: string
          task_error: string | null
          task_finished_at: string | null
          task_id: string
          type: string | null
          user_id: string
        }
        Insert: {
          id?: number
          task_created_at?: string
          task_error?: string | null
          task_finished_at?: string | null
          task_id: string
          type?: string | null
          user_id: string
        }
        Update: {
          id?: number
          task_created_at?: string
          task_error?: string | null
          task_finished_at?: string | null
          task_id?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      tool: {
        Row: {
          id: number
          name: string
          user_id: string
        }
        Insert: {
          id?: number
          name: string
          user_id: string
        }
        Update: {
          id?: number
          name?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      find_tables_using_custom_type: {
        Args: {
          type_id_param: string
        }
        Returns: {
          prefixed_id: string
        }[]
      }
      get_unique_custom_type_name: {
        Args: {
          suggested_name: string
          user_id_param: string
        }
        Returns: string
      }
      get_user_storage_usage: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

