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
      chemical: {
        Row: {
          display_options: Json | null
          id: number
          inchi: string
          inchi_key: string
          name: string | null
        }
        Insert: {
          display_options?: Json | null
          id?: number
          inchi: string
          inchi_key: string
          name?: string | null
        }
        Update: {
          display_options?: Json | null
          id?: number
          inchi?: string
          inchi_key?: string
          name?: string | null
        }
      }
      genome: {
        Row: {
          genbank_gz_object: string | null
          id: number
          sequence_bucket: string
          species_id: number
          strain_name: string | null
        }
        Insert: {
          genbank_gz_object?: string | null
          id?: number
          sequence_bucket?: string
          species_id: number
          strain_name?: string | null
        }
        Update: {
          genbank_gz_object?: string | null
          id?: number
          sequence_bucket?: string
          species_id?: number
          strain_name?: string | null
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
          display_options: Json | null
          hash: string
          id: number
          name: string | null
        }
        Insert: {
          display_options?: Json | null
          hash: string
          id?: number
          name?: string | null
        }
        Update: {
          display_options?: Json | null
          hash?: string
          id?: number
          name?: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      search: {
        Args: { query: string }
        Returns: Json
      }
      weighted_similarity: {
        Args: { query: string; target: string }
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
          created_at: string | null
          id: string
          name: string
          owner: string | null
          public: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          name: string
          owner?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
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
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      extension: {
        Args: { name: string }
        Returns: string
      }
      filename: {
        Args: { name: string }
        Returns: string
      }
      foldername: {
        Args: { name: string }
        Returns: string[]
      }
      get_size_by_bucket: {
        Args: Record<PropertyKey, never>
        Returns: { size: number; bucket_id: string }[]
      }
      search: {
        Args: {
          prefix: string
          bucketname: string
          limits: number
          levels: number
          offsets: number
          search: string
          sortcolumn: string
          sortorder: string
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

