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
      column_filter: {
        Row: {
          column_index: number
          created_at: string
          filter_type: string
          id: number
          table_identification_id: number
          updated_at: string
        }
        Insert: {
          column_index: number
          created_at?: string
          filter_type: string
          id?: number
          table_identification_id: number
          updated_at?: string
        }
        Update: {
          column_index?: number
          created_at?: string
          filter_type?: string
          id?: number
          table_identification_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "column_filter_table_identification_id_fkey"
            columns: ["table_identification_id"]
            isOneToOne: false
            referencedRelation: "table_identification"
            referencedColumns: ["id"]
          },
        ]
      }
      column_identification: {
        Row: {
          column_index: number
          created_at: string
          description: string
          external_id: string | null
          external_kind: string | null
          external_name: string | null
          id: number
          is_custom: boolean
          log_scale: boolean | null
          max_value: number | null
          min_value: number | null
          table_identification_id: number
          type: string
          updated_at: string
        }
        Insert: {
          column_index: number
          created_at?: string
          description: string
          external_id?: string | null
          external_kind?: string | null
          external_name?: string | null
          id?: number
          is_custom?: boolean
          log_scale?: boolean | null
          max_value?: number | null
          min_value?: number | null
          table_identification_id: number
          type: string
          updated_at?: string
        }
        Update: {
          column_index?: number
          created_at?: string
          description?: string
          external_id?: string | null
          external_kind?: string | null
          external_name?: string | null
          id?: number
          is_custom?: boolean
          log_scale?: boolean | null
          max_value?: number | null
          min_value?: number | null
          table_identification_id?: number
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "column_identification_table_identification_id_fkey"
            columns: ["table_identification_id"]
            isOneToOne: false
            referencedRelation: "table_identification"
            referencedColumns: ["id"]
          },
        ]
      }
      column_redis_data: {
        Row: {
          column_index: number
          created_at: string
          id: number
          matches_count: number | null
          status: string | null
          table_identification_id: number
          total_count: number | null
          updated_at: string
        }
        Insert: {
          column_index: number
          created_at?: string
          id?: number
          matches_count?: number | null
          status?: string | null
          table_identification_id: number
          total_count?: number | null
          updated_at?: string
        }
        Update: {
          column_index?: number
          created_at?: string
          id?: number
          matches_count?: number | null
          status?: string | null
          table_identification_id?: number
          total_count?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "column_redis_data_table_identification_id_fkey"
            columns: ["table_identification_id"]
            isOneToOne: false
            referencedRelation: "table_identification"
            referencedColumns: ["id"]
          },
        ]
      }
      column_redis_info: {
        Row: {
          column_redis_data_id: number
          created_at: string
          description: string | null
          id: number
          link: string | null
          link_prefix: string | null
          num_entries: number | null
          updated_at: string
        }
        Insert: {
          column_redis_data_id: number
          created_at?: string
          description?: string | null
          id?: number
          link?: string | null
          link_prefix?: string | null
          num_entries?: number | null
          updated_at?: string
        }
        Update: {
          column_redis_data_id?: number
          created_at?: string
          description?: string | null
          id?: number
          link?: string | null
          link_prefix?: string | null
          num_entries?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "column_redis_info_column_redis_data_id_fkey"
            columns: ["column_redis_data_id"]
            isOneToOne: true
            referencedRelation: "column_redis_data"
            referencedColumns: ["id"]
          },
        ]
      }
      column_redis_match: {
        Row: {
          column_redis_data_id: number
          created_at: string
          id: number
          match_value: string
          updated_at: string
        }
        Insert: {
          column_redis_data_id: number
          created_at?: string
          id?: number
          match_value: string
          updated_at?: string
        }
        Update: {
          column_redis_data_id?: number
          created_at?: string
          id?: number
          match_value?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "column_redis_match_column_redis_data_id_fkey"
            columns: ["column_redis_data_id"]
            isOneToOne: false
            referencedRelation: "column_redis_data"
            referencedColumns: ["id"]
          },
        ]
      }
      column_stats: {
        Row: {
          column_index: number
          created_at: string
          id: number
          max_value: number | null
          min_value: number | null
          table_identification_id: number
          updated_at: string
        }
        Insert: {
          column_index: number
          created_at?: string
          id?: number
          max_value?: number | null
          min_value?: number | null
          table_identification_id: number
          updated_at?: string
        }
        Update: {
          column_index?: number
          created_at?: string
          id?: number
          max_value?: number | null
          min_value?: number | null
          table_identification_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "column_stats_table_identification_id_fkey"
            columns: ["table_identification_id"]
            isOneToOne: false
            referencedRelation: "table_identification"
            referencedColumns: ["id"]
          },
        ]
      }
      column_suggested_action: {
        Row: {
          action: string
          column_identification_id: number
          created_at: string
          id: number
          updated_at: string
        }
        Insert: {
          action: string
          column_identification_id: number
          created_at?: string
          id?: number
          updated_at?: string
        }
        Update: {
          action?: string
          column_identification_id?: number
          created_at?: string
          id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "column_suggested_action_column_identification_id_fkey"
            columns: ["column_identification_id"]
            isOneToOne: false
            referencedRelation: "column_identification"
            referencedColumns: ["id"]
          },
        ]
      }
      column_type_options: {
        Row: {
          column_index: number
          created_at: string
          id: number
          logarithmic: boolean
          max_value: number | null
          min_value: number | null
          table_identification_id: number
          updated_at: string
        }
        Insert: {
          column_index: number
          created_at?: string
          id?: number
          logarithmic?: boolean
          max_value?: number | null
          min_value?: number | null
          table_identification_id: number
          updated_at?: string
        }
        Update: {
          column_index?: number
          created_at?: string
          id?: number
          logarithmic?: boolean
          max_value?: number | null
          min_value?: number | null
          table_identification_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "column_type_options_table_identification_id_fkey"
            columns: ["table_identification_id"]
            isOneToOne: false
            referencedRelation: "table_identification"
            referencedColumns: ["id"]
          },
        ]
      }
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
          has_header: boolean
          id: number
          prefixed_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          has_header?: boolean
          id?: number
          prefixed_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          has_header?: boolean
          id?: number
          prefixed_id?: string
          updated_at?: string
          user_id?: string
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
      widget: {
        Row: {
          created_at: string
          description: string
          display_order: number | null
          engine: string
          id: number
          is_suggested: boolean
          name: string
          observable_plot_code: string | null
          prefixed_id: string
          type: string
          updated_at: string
          user_id: string
          vega_lite_spec: string | null
          widget_id: string
        }
        Insert: {
          created_at?: string
          description: string
          display_order?: number | null
          engine: string
          id?: number
          is_suggested?: boolean
          name: string
          observable_plot_code?: string | null
          prefixed_id: string
          type: string
          updated_at?: string
          user_id: string
          vega_lite_spec?: string | null
          widget_id: string
        }
        Update: {
          created_at?: string
          description?: string
          display_order?: number | null
          engine?: string
          id?: number
          is_suggested?: boolean
          name?: string
          observable_plot_code?: string | null
          prefixed_id?: string
          type?: string
          updated_at?: string
          user_id?: string
          vega_lite_spec?: string | null
          widget_id?: string
        }
        Relationships: []
      }
      widget_preferences: {
        Row: {
          active_engine: string | null
          created_at: string
          id: number
          prefixed_id: string
          sidebar_width: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active_engine?: string | null
          created_at?: string
          id?: number
          prefixed_id: string
          sidebar_width?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active_engine?: string | null
          created_at?: string
          id?: number
          prefixed_id?: string
          sidebar_width?: number | null
          updated_at?: string
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

