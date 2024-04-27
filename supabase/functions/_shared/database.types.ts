export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      app: {
        Row: {
          deploy_subdomain: string | null
          deploy_subdomain_ready: boolean
          id: string
          name: string
          user_id: string
        }
        Insert: {
          deploy_subdomain?: string | null
          deploy_subdomain_ready?: boolean
          id?: string
          name: string
          user_id: string
        }
        Update: {
          deploy_subdomain?: string | null
          deploy_subdomain_ready?: boolean
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      app_files: {
        Row: {
          app_id: string
          file: string
          id: string
          name: string
        }
        Insert: {
          app_id: string
          file: string
          id?: string
          name: string
        }
        Update: {
          app_id?: string
          file?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_files_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "app"
            referencedColumns: ["id"]
          }
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

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
      Database["public"]["Views"])
  ? (Database["public"]["Tables"] &
      Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
  ? Database["public"]["Enums"][PublicEnumNameOrOptions]
  : never

