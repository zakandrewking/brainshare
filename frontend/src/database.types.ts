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
        Relationships: [
          {
            foreignKeyName: "article_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profile"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: []
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
        Relationships: [
          {
            foreignKeyName: "chemical_history_chemical_id_fkey"
            columns: ["chemical_id"]
            referencedRelation: "chemical"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chemical_history_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profile"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: []
      }
      edge: {
        Row: {
          data: Json | null
          destination_id: number
          hash: string
          id: number
          relationship: string
          source_id: number
          user_id: string | null
        }
        Insert: {
          data?: Json | null
          destination_id: number
          hash: string
          id?: number
          relationship: string
          source_id: number
          user_id?: string | null
        }
        Update: {
          data?: Json | null
          destination_id?: number
          hash?: string
          id?: number
          relationship?: string
          source_id?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "edge_destination_id_fkey"
            columns: ["destination_id"]
            referencedRelation: "node"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edge_source_id_fkey"
            columns: ["source_id"]
            referencedRelation: "node"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edge_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "edge_history_edge_id_fkey"
            columns: ["edge_id"]
            referencedRelation: "edge"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edge_history_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
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
          project_id: number | null
          size: number
          tokens: number | null
          user_id: string
        }
        Insert: {
          bucket_id: string
          id?: number
          latest_task_id?: string | null
          mime_type?: string | null
          name: string
          object_path: string
          project_id?: number | null
          size: number
          tokens?: number | null
          user_id: string
        }
        Update: {
          bucket_id?: string
          id?: number
          latest_task_id?: string | null
          mime_type?: string | null
          name?: string
          object_path?: string
          project_id?: number | null
          size?: number
          tokens?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "file_project_id_fkey"
            columns: ["project_id"]
            referencedRelation: "project"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "file_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      file_data: {
        Row: {
          id: number
          synced_file_id: number
          text_content: string | null
          text_summary: string | null
          user_id: string
        }
        Insert: {
          id?: number
          synced_file_id: number
          text_content?: string | null
          text_summary?: string | null
          user_id: string
        }
        Update: {
          id?: number
          synced_file_id?: number
          text_content?: string | null
          text_summary?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "file_data_synced_file_id_fkey"
            columns: ["synced_file_id"]
            referencedRelation: "synced_file"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "file_data_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "genome_species_id_fkey"
            columns: ["species_id"]
            referencedRelation: "species"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "genome_history_genome_id_fkey"
            columns: ["genome_id"]
            referencedRelation: "genome"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "genome_history_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profile"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "genome_synonym_genome_id_fkey"
            columns: ["genome_id"]
            referencedRelation: "genome"
            referencedColumns: ["id"]
          }
        ]
      }
      graph: {
        Row: {
          created_at: string
          id: number
          name: string
          project_id: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
          project_id?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
          project_id?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "graph_project_id_fkey"
            columns: ["project_id"]
            referencedRelation: "project"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "graph_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      node: {
        Row: {
          data: Json
          graph_id: number | null
          hash: string
          id: number
          node_type_id: string
          user_id: string | null
        }
        Insert: {
          data?: Json
          graph_id?: number | null
          hash: string
          id?: number
          node_type_id: string
          user_id?: string | null
        }
        Update: {
          data?: Json
          graph_id?: number | null
          hash?: string
          id?: number
          node_type_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "node_graph_id_fkey"
            columns: ["graph_id"]
            referencedRelation: "graph"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "node_node_type_id_fkey"
            columns: ["node_type_id"]
            referencedRelation: "node_type"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "node_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "node_history_node_id_fkey"
            columns: ["node_id"]
            referencedRelation: "node"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "node_history_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      node_type: {
        Row: {
          detail_definition_ids: string[]
          icon: string | null
          id: string
          list_definition_ids: string[]
          options: Json
          top_level: boolean
        }
        Insert: {
          detail_definition_ids: string[]
          icon?: string | null
          id: string
          list_definition_ids: string[]
          options?: Json
          top_level?: boolean
        }
        Update: {
          detail_definition_ids?: string[]
          icon?: string | null
          id?: string
          list_definition_ids?: string[]
          options?: Json
          top_level?: boolean
        }
        Relationships: []
      }
      oauth2_connection: {
        Row: {
          access_token: string | null
          expires_at: string | null
          id: number
          name: string
          needs_reconnect: boolean
          refresh_token: string | null
          scope: string[] | null
          state: string | null
          token_type: string | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          expires_at?: string | null
          id?: number
          name: string
          needs_reconnect?: boolean
          refresh_token?: string | null
          scope?: string[] | null
          state?: string | null
          token_type?: string | null
          user_id: string
        }
        Update: {
          access_token?: string | null
          expires_at?: string | null
          id?: number
          name?: string
          needs_reconnect?: boolean
          refresh_token?: string | null
          scope?: string[] | null
          state?: string | null
          token_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "oauth2_connection_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "profile_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      project: {
        Row: {
          created_at: string
          id: number
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: []
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
        Relationships: [
          {
            foreignKeyName: "protein_history_protein_id_fkey"
            columns: ["protein_id"]
            referencedRelation: "protein"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "protein_history_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profile"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "protein_reaction_protein_id_fkey"
            columns: ["protein_id"]
            referencedRelation: "protein"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "protein_reaction_reaction_id_fkey"
            columns: ["reaction_id"]
            referencedRelation: "reaction"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "protein_species_protein_id_fkey"
            columns: ["protein_id"]
            referencedRelation: "protein"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "protein_species_species_id_fkey"
            columns: ["species_id"]
            referencedRelation: "species"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: []
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
        Relationships: [
          {
            foreignKeyName: "reaction_history_reaction_id_fkey"
            columns: ["reaction_id"]
            referencedRelation: "reaction"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reaction_history_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profile"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: []
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
        Relationships: [
          {
            foreignKeyName: "species_history_species_id_fkey"
            columns: ["species_id"]
            referencedRelation: "species"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "species_history_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profile"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "stoichiometry_chemical_id_fkey"
            columns: ["chemical_id"]
            referencedRelation: "chemical"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stoichiometry_reaction_id_fkey"
            columns: ["reaction_id"]
            referencedRelation: "reaction"
            referencedColumns: ["id"]
          }
        ]
      }
      synced_file: {
        Row: {
          conflict_details: Json | null
          deleted: boolean
          id: number
          is_folder: boolean
          mime_type: string
          name: string
          parent_ids: number[]
          processing_status: string | null
          remote_id: string | null
          source: string
          synced_folder_id: number
          user_id: string
        }
        Insert: {
          conflict_details?: Json | null
          deleted?: boolean
          id?: number
          is_folder?: boolean
          mime_type: string
          name: string
          parent_ids?: number[]
          processing_status?: string | null
          remote_id?: string | null
          source: string
          synced_folder_id: number
          user_id: string
        }
        Update: {
          conflict_details?: Json | null
          deleted?: boolean
          id?: number
          is_folder?: boolean
          mime_type?: string
          name?: string
          parent_ids?: number[]
          processing_status?: string | null
          remote_id?: string | null
          source?: string
          synced_folder_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "synced_file_synced_folder_id_fkey"
            columns: ["synced_folder_id"]
            referencedRelation: "synced_folder"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "synced_file_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      synced_folder: {
        Row: {
          id: number
          name: string
          project_id: number | null
          remote_id: string
          source: string
          update_task_created_at: string | null
          update_task_error: string | null
          update_task_id: string | null
          user_id: string
        }
        Insert: {
          id?: number
          name: string
          project_id?: number | null
          remote_id: string
          source: string
          update_task_created_at?: string | null
          update_task_error?: string | null
          update_task_id?: string | null
          user_id: string
        }
        Update: {
          id?: number
          name?: string
          project_id?: number | null
          remote_id?: string
          source?: string
          update_task_created_at?: string | null
          update_task_error?: string | null
          update_task_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "synced_folder_project_id_fkey"
            columns: ["project_id"]
            referencedRelation: "project"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "synced_folder_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "synonym_chemical_id_fkey"
            columns: ["chemical_id"]
            referencedRelation: "chemical"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "synonym_protein_id_fkey"
            columns: ["protein_id"]
            referencedRelation: "protein"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "synonym_reaction_id_fkey"
            columns: ["reaction_id"]
            referencedRelation: "reaction"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "synonym_species_id_fkey"
            columns: ["species_id"]
            referencedRelation: "species"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "user_role_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profile"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      node_search: {
        Row: {
          id: number | null
          name: string | null
          node_type_id: string | null
          source: string | null
          value: string | null
        }
        Relationships: []
      }
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
      search_graph: {
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
        Relationships: [
          {
            foreignKeyName: "buckets_owner_fkey"
            columns: ["owner"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: []
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
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          }
        ]
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
        Returns: unknown
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

