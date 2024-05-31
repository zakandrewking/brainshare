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
      app: {
        Row: {
          deploy_app_task_link_id: number | null
          deploy_subdomain_ready: boolean
          id: string
          name: string
          prefix: string | null
          user_id: string
        }
        Insert: {
          deploy_app_task_link_id?: number | null
          deploy_subdomain_ready?: boolean
          id?: string
          name: string
          prefix?: string | null
          user_id: string
        }
        Update: {
          deploy_app_task_link_id?: number | null
          deploy_subdomain_ready?: boolean
          id?: string
          name?: string
          prefix?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_deploy_app_task_link_id_fkey"
            columns: ["deploy_app_task_link_id"]
            isOneToOne: false
            referencedRelation: "task_link"
            referencedColumns: ["id"]
          },
        ]
      }
      app_file: {
        Row: {
          app_id: string
          file_id: number
        }
        Insert: {
          app_id: string
          file_id: number
        }
        Update: {
          app_id?: string
          file_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "app_file_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "app"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_file_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "file"
            referencedColumns: ["id"]
          },
        ]
      }
      file: {
        Row: {
          bucket_id: string
          id: number
          latest_task_id: string | null
          mime_type: string | null
          name: string
          object_path: string
          size: number
          user_id: string
        }
        Insert: {
          bucket_id: string
          id?: number
          latest_task_id?: string | null
          mime_type?: string | null
          name: string
          object_path: string
          size: number
          user_id: string
        }
        Update: {
          bucket_id?: string
          id?: number
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
      requesting_user_id: {
        Args: Record<PropertyKey, never>
        Returns: string
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

