export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export interface Database {
  public: {
    Tables: {
      article: {
        Row: {
          authors: Json
          doi: string
          id: number
          journal: string | null
          public: boolean
          title: string
          user_id: string
        }
        Insert: {
          authors: Json
          doi: string
          id?: number
          journal?: string | null
          public?: boolean
          title: string
          user_id: string
        }
        Update: {
          authors?: Json
          doi?: string
          id?: number
          journal?: string | null
          public?: boolean
          title?: string
          user_id?: string
        }
      }
      chemical: {
        Row: {
          id: number
          inchi: string
          inchi_key: string
          name: string | null
        }
        Insert: {
          id?: number
          inchi: string
          inchi_key: string
          name?: string | null
        }
        Update: {
          id?: number
          inchi?: string
          inchi_key?: string
          name?: string | null
        }
      }
      chemical_history: {
        Row: {
          change_type: string
          chemical_id: number
          id: number
          new_values: Json | null
          source: string | null
          source_details: string | null
          time: string
          user_id: string | null
        }
        Insert: {
          change_type: string
          chemical_id: number
          id?: number
          new_values?: Json | null
          source?: string | null
          source_details?: string | null
          time: string
          user_id?: string | null
        }
        Update: {
          change_type?: string
          chemical_id?: number
          id?: number
          new_values?: Json | null
          source?: string | null
          source_details?: string | null
          time?: string
          user_id?: string | null
        }
      }
      definition: {
        Row: {
          component_id: string
          id: string
          options: Json
        }
        Insert: {
          component_id: string
          id: string
          options?: Json
        }
        Update: {
          component_id?: string
          id?: string
          options?: Json
        }
      }
      edge: {
        Row: {
          data: Json | null
          destination: number
          id: number
          source: number
          user_id: string | null
        }
        Insert: {
          data?: Json | null
          destination: number
          id?: number
          source: number
          user_id?: string | null
        }
        Update: {
          data?: Json | null
          destination?: number
          id?: number
          source?: number
          user_id?: string | null
        }
      }
      edge_history: {
        Row: {
          change_column: string | null
          change_type: string
          edge_id: number
          id: number
          source: string
          source_details: string
          time: string | null
          user_id: string | null
        }
        Insert: {
          change_column?: string | null
          change_type: string
          edge_id: number
          id?: number
          source: string
          source_details: string
          time?: string | null
          user_id?: string | null
        }
        Update: {
          change_column?: string | null
          change_type?: string
          edge_id?: number
          id?: number
          source?: string
          source_details?: string
          time?: string | null
          user_id?: string | null
        }
      }
      genome: {
        Row: {
          bucket: string
          genbank_gz_file_size_bytes: number | null
          genbank_gz_object: string | null
          id: number
          species_id: number
          strain_name: string | null
        }
        Insert: {
          bucket?: string
          genbank_gz_file_size_bytes?: number | null
          genbank_gz_object?: string | null
          id?: number
          species_id: number
          strain_name?: string | null
        }
        Update: {
          bucket?: string
          genbank_gz_file_size_bytes?: number | null
          genbank_gz_object?: string | null
          id?: number
          species_id?: number
          strain_name?: string | null
        }
      }
      genome_history: {
        Row: {
          change_column: string | null
          change_type: string
          genome_id: number
          id: number
          source: string
          source_details: string
          time: string | null
          user_id: string | null
        }
        Insert: {
          change_column?: string | null
          change_type: string
          genome_id: number
          id?: number
          source: string
          source_details: string
          time?: string | null
          user_id?: string | null
        }
        Update: {
          change_column?: string | null
          change_type?: string
          genome_id?: number
          id?: number
          source?: string
          source_details?: string
          time?: string | null
          user_id?: string | null
        }
      }
      genome_synonym: {
        Row: {
          genome_id: number
          source: string
          value: string
        }
        Insert: {
          genome_id: number
          source: string
          value: string
        }
        Update: {
          genome_id?: number
          source?: string
          value?: string
        }
      }
      node: {
        Row: {
          data: Json
          hash: string
          id: number
          node_type_id: string
          user_id: string | null
        }
        Insert: {
          data?: Json
          hash: string
          id?: number
          node_type_id: string
          user_id?: string | null
        }
        Update: {
          data?: Json
          hash?: string
          id?: number
          node_type_id?: string
          user_id?: string | null
        }
      }
      node_history: {
        Row: {
          change_column: string | null
          change_type: string
          id: number
          node_id: number
          source: string
          source_details: string
          time: string | null
          user_id: string | null
        }
        Insert: {
          change_column?: string | null
          change_type: string
          id?: number
          node_id: number
          source: string
          source_details: string
          time?: string | null
          user_id?: string | null
        }
        Update: {
          change_column?: string | null
          change_type?: string
          id?: number
          node_id?: number
          source?: string
          source_details?: string
          time?: string | null
          user_id?: string | null
        }
      }
      node_type: {
        Row: {
          detail_definition_ids: string[]
          icon: string | null
          id: string
          list_definition_ids: string[]
          options: Json
        }
        Insert: {
          detail_definition_ids: string[]
          icon?: string | null
          id: string
          list_definition_ids: string[]
          options?: Json
        }
        Update: {
          detail_definition_ids?: string[]
          icon?: string | null
          id?: string
          list_definition_ids?: string[]
          options?: Json
        }
      }
      profile: {
        Row: {
          id: string
          username: string | null
        }
        Insert: {
          id: string
          username?: string | null
        }
        Update: {
          id?: string
          username?: string | null
        }
      }
      protein: {
        Row: {
          hash: string
          id: number
          name: string | null
          sequence: string
          short_name: string | null
        }
        Insert: {
          hash: string
          id?: number
          name?: string | null
          sequence: string
          short_name?: string | null
        }
        Update: {
          hash?: string
          id?: number
          name?: string | null
          sequence?: string
          short_name?: string | null
        }
      }
      protein_history: {
        Row: {
          change_column: string | null
          change_type: string
          id: number
          protein_id: number
          source: string
          source_details: string
          time: string | null
          user_id: string | null
        }
        Insert: {
          change_column?: string | null
          change_type: string
          id?: number
          protein_id: number
          source: string
          source_details: string
          time?: string | null
          user_id?: string | null
        }
        Update: {
          change_column?: string | null
          change_type?: string
          id?: number
          protein_id?: number
          source?: string
          source_details?: string
          time?: string | null
          user_id?: string | null
        }
      }
      protein_reaction: {
        Row: {
          protein_id: number
          reaction_id: number
        }
        Insert: {
          protein_id: number
          reaction_id: number
        }
        Update: {
          protein_id?: number
          reaction_id?: number
        }
      }
      protein_species: {
        Row: {
          protein_id: number
          species_id: number
        }
        Insert: {
          protein_id: number
          species_id: number
        }
        Update: {
          protein_id?: number
          species_id?: number
        }
      }
      reaction: {
        Row: {
          hash: string
          id: number
          name: string | null
        }
        Insert: {
          hash: string
          id?: number
          name?: string | null
        }
        Update: {
          hash?: string
          id?: number
          name?: string | null
        }
      }
      reaction_history: {
        Row: {
          change_type: string
          id: number
          new_values: Json | null
          reaction_id: number
          source: string | null
          source_details: string | null
          time: string
          user_id: string | null
        }
        Insert: {
          change_type: string
          id?: number
          new_values?: Json | null
          reaction_id: number
          source?: string | null
          source_details?: string | null
          time: string
          user_id?: string | null
        }
        Update: {
          change_type?: string
          id?: number
          new_values?: Json | null
          reaction_id?: number
          source?: string | null
          source_details?: string | null
          time?: string
          user_id?: string | null
        }
      }
      species: {
        Row: {
          hash: string
          id: number
          name: string | null
          rank: string | null
        }
        Insert: {
          hash: string
          id?: number
          name?: string | null
          rank?: string | null
        }
        Update: {
          hash?: string
          id?: number
          name?: string | null
          rank?: string | null
        }
      }
      species_history: {
        Row: {
          change_column: string | null
          change_type: string
          id: number
          source: string
          source_details: string
          species_id: number
          time: string | null
          user_id: string | null
        }
        Insert: {
          change_column?: string | null
          change_type: string
          id?: number
          source: string
          source_details: string
          species_id: number
          time?: string | null
          user_id?: string | null
        }
        Update: {
          change_column?: string | null
          change_type?: string
          id?: number
          source?: string
          source_details?: string
          species_id?: number
          time?: string | null
          user_id?: string | null
        }
      }
      stoichiometry: {
        Row: {
          chemical_id: number
          coefficient: number
          compartment_rule: string | null
          reaction_id: number
        }
        Insert: {
          chemical_id: number
          coefficient: number
          compartment_rule?: string | null
          reaction_id: number
        }
        Update: {
          chemical_id?: number
          coefficient?: number
          compartment_rule?: string | null
          reaction_id?: number
        }
      }
      synonym: {
        Row: {
          chemical_id: number | null
          id: number
          protein_id: number | null
          reaction_id: number | null
          source: string
          species_id: number | null
          value: string
        }
        Insert: {
          chemical_id?: number | null
          id?: number
          protein_id?: number | null
          reaction_id?: number | null
          source: string
          species_id?: number | null
          value: string
        }
        Update: {
          chemical_id?: number | null
          id?: number
          protein_id?: number | null
          reaction_id?: number | null
          source?: string
          species_id?: number | null
          value?: string
        }
      }
      user_role: {
        Row: {
          role: string
          user_id: string
        }
        Insert: {
          role: string
          user_id: string
        }
        Update: {
          role?: string
          user_id?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      json_matches_schema: {
        Args: {
          schema: Json
          instance: Json
        }
        Returns: boolean
      }
      jsonb_diff_val: {
        Args: {
          val1: Json
          val2: Json
        }
        Returns: Json
      }
      jsonb_matches_schema: {
        Args: {
          schema: Json
          instance: Json
        }
        Returns: boolean
      }
      node_setup: {
        Args: {
          table_name: string
        }
        Returns: undefined
      }
      search: {
        Args: {
          query: string
          resource_filter?: string
        }
        Returns: Json
      }
      weighted_similarity: {
        Args: {
          query: string
          target: string
        }
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
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          public: boolean | null
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          path_tokens: string[] | null
          updated_at: string | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          version?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_insert_object: {
        Args: {
          bucketid: string
          name: string
          owner: string
          metadata: Json
        }
        Returns: undefined
      }
      extension: {
        Args: {
          name: string
        }
        Returns: string
      }
      filename: {
        Args: {
          name: string
        }
        Returns: string
      }
      foldername: {
        Args: {
          name: string
        }
        Returns: string[]
      }
      get_size_by_bucket: {
        Args: Record<PropertyKey, never>
        Returns: {
          size: number
          bucket_id: string
        }[]
      }
      search: {
        Args: {
          prefix: string
          bucketname: string
          limits?: number
          levels?: number
          offsets?: number
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          name: string
          id: string
          updated_at: string
          created_at: string
          last_accessed_at: string
          metadata: Json
        }[]
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

