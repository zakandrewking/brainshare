export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

export interface Database {
  public: {
    Tables: {
      chemical: {
        Row: {
          id: number;
          inchi: string;
          name: string | null;
          created_at: string | null;
          display_options: Json | null;
        };
        Insert: {
          id?: number;
          inchi: string;
          name?: string | null;
          created_at?: string | null;
          display_options?: Json | null;
        };
        Update: {
          id?: number;
          inchi?: string;
          name?: string | null;
          created_at?: string | null;
          display_options?: Json | null;
        };
      };
      synonym: {
        Row: {
          id: number;
          source: string;
          value: string;
          chemical_id: number;
          created_at: string | null;
        };
        Insert: {
          id?: number;
          source: string;
          value: string;
          chemical_id: number;
          created_at?: string | null;
        };
        Update: {
          id?: number;
          source?: string;
          value?: string;
          chemical_id?: number;
          created_at?: string | null;
        };
      };
      species: {
        Row: {
          id: number;
          name: string | null;
          display_options: Json | null;
          created_at: string | null;
        };
        Insert: {
          id?: number;
          name?: string | null;
          display_options?: Json | null;
          created_at?: string | null;
        };
        Update: {
          id?: number;
          name?: string | null;
          display_options?: Json | null;
          created_at?: string | null;
        };
      };
      display_config: {
        Row: {
          id: number;
          config: Json | null;
          created_at: string | null;
        };
        Insert: {
          id?: number;
          config?: Json | null;
          created_at?: string | null;
        };
        Update: {
          id?: number;
          config?: Json | null;
          created_at?: string | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      search: {
        Args: { query: string };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

