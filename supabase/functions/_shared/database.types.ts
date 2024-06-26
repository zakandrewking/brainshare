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
            isOneToOne: false
            referencedRelation: "user"
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
            isOneToOne: false
            referencedRelation: "chemical"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chemical_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          }
        ]
      }
      dataset_history_metadata: {
        Row: {
          change_column: string | null
          change_type: string
          dataset_row_id: number
          dataset_table_name: string
          id: number
          source: string
          source_details: string
          time: string | null
          user_id: string | null
        }
        Insert: {
          change_column?: string | null
          change_type: string
          dataset_row_id: number
          dataset_table_name: string
          id?: number
          source: string
          source_details: string
          time?: string | null
          user_id?: string | null
        }
        Update: {
          change_column?: string | null
          change_type?: string
          dataset_row_id?: number
          dataset_table_name?: string
          id?: number
          source?: string
          source_details?: string
          time?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dataset_history_metadata_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          }
        ]
      }
      dataset_metadata: {
        Row: {
          id: number
          project_id: string
          sync_folder_task_link_id: number | null
          table_name: string
          user_id: string
        }
        Insert: {
          id?: number
          project_id: string
          sync_folder_task_link_id?: number | null
          table_name: string
          user_id: string
        }
        Update: {
          id?: number
          project_id?: string
          sync_folder_task_link_id?: number | null
          table_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dataset_metadata_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dataset_metadata_sync_folder_task_link_id_fkey"
            columns: ["sync_folder_task_link_id"]
            isOneToOne: false
            referencedRelation: "task_link"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dataset_metadata_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
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
      djt_history_metadata: {
        Row: {
          change_column: string | null
          change_type: string
          djt_row_id: number
          djt_table_name: string
          id: number
          source: string
          source_details: string
          time: string | null
          user_id: string | null
        }
        Insert: {
          change_column?: string | null
          change_type: string
          djt_row_id: number
          djt_table_name: string
          id?: number
          source: string
          source_details: string
          time?: string | null
          user_id?: string | null
        }
        Update: {
          change_column?: string | null
          change_type?: string
          djt_row_id?: number
          djt_table_name?: string
          id?: number
          source?: string
          source_details?: string
          time?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "djt_history_metadata_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          }
        ]
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
            isOneToOne: false
            referencedRelation: "node"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edge_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "node"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edge_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
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
            isOneToOne: false
            referencedRelation: "edge"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edge_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
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
          project_id: string
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
          project_id: string
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
          project_id?: string
          size?: number
          tokens?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "file_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "file_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
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
            isOneToOne: false
            referencedRelation: "synced_file"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "file_data_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
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
            isOneToOne: false
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
            isOneToOne: false
            referencedRelation: "genome"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "genome_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
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
            isOneToOne: false
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
          project_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
          project_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
          project_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "graph_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "graph_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          }
        ]
      }
      graph_draft: {
        Row: {
          id: number
          synced_file_id: number
          user_id: string | null
        }
        Insert: {
          id?: number
          synced_file_id: number
          user_id?: string | null
        }
        Update: {
          id?: number
          synced_file_id?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "graph_draft_synced_file_id_fkey"
            columns: ["synced_file_id"]
            isOneToOne: false
            referencedRelation: "synced_file"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "graph_draft_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          }
        ]
      }
      graph_draft_edge: {
        Row: {
          destination_id: number
          graph_draft_id: number
          id: number
          source_id: number
          user_id: string | null
          value: string
        }
        Insert: {
          destination_id: number
          graph_draft_id: number
          id?: number
          source_id: number
          user_id?: string | null
          value: string
        }
        Update: {
          destination_id?: number
          graph_draft_id?: number
          id?: number
          source_id?: number
          user_id?: string | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "graph_draft_edge_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "graph_draft_node"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "graph_draft_edge_graph_draft_id_fkey"
            columns: ["graph_draft_id"]
            isOneToOne: false
            referencedRelation: "graph_draft"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "graph_draft_edge_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "graph_draft_node"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "graph_draft_edge_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          }
        ]
      }
      graph_draft_node: {
        Row: {
          graph_draft_id: number
          id: number
          user_id: string | null
          value: string
        }
        Insert: {
          graph_draft_id: number
          id?: number
          user_id?: string | null
          value: string
        }
        Update: {
          graph_draft_id?: number
          id?: number
          user_id?: string | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "graph_draft_node_graph_draft_id_fkey"
            columns: ["graph_draft_id"]
            isOneToOne: false
            referencedRelation: "graph_draft"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "graph_draft_node_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
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
            isOneToOne: false
            referencedRelation: "graph"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "node_node_type_id_fkey"
            columns: ["node_type_id"]
            isOneToOne: false
            referencedRelation: "node_type"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "node_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
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
            isOneToOne: false
            referencedRelation: "node"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "node_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
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
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          }
        ]
      }
      project: {
        Row: {
          created_at: string
          id: string
          name: string
          schema_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          schema_name?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          schema_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
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
            isOneToOne: false
            referencedRelation: "protein"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "protein_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
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
            isOneToOne: false
            referencedRelation: "protein"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "protein_reaction_reaction_id_fkey"
            columns: ["reaction_id"]
            isOneToOne: false
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
            isOneToOne: false
            referencedRelation: "protein"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "protein_species_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
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
            isOneToOne: false
            referencedRelation: "reaction"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reaction_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          }
        ]
      }
      resource_type: {
        Row: {
          id: number
        }
        Insert: {
          id?: number
        }
        Update: {
          id?: number
        }
        Relationships: []
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
            isOneToOne: false
            referencedRelation: "species"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "species_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
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
            isOneToOne: false
            referencedRelation: "chemical"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stoichiometry_reaction_id_fkey"
            columns: ["reaction_id"]
            isOneToOne: false
            referencedRelation: "reaction"
            referencedColumns: ["id"]
          }
        ]
      }
      sync_options: {
        Row: {
          auto_sync_extensions: string[]
          has_seen_sync_options: boolean
          id: number
          project_id: string
          source: string
          user_id: string
        }
        Insert: {
          auto_sync_extensions?: string[]
          has_seen_sync_options?: boolean
          id?: number
          project_id: string
          source: string
          user_id: string
        }
        Update: {
          auto_sync_extensions?: string[]
          has_seen_sync_options?: boolean
          id?: number
          project_id?: string
          source?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_options_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sync_options_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
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
          remote_id: string | null
          source: string
          sync_file_to_dataset_task_link_id: number | null
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
          remote_id?: string | null
          source: string
          sync_file_to_dataset_task_link_id?: number | null
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
          remote_id?: string | null
          source?: string
          sync_file_to_dataset_task_link_id?: number | null
          synced_folder_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "synced_file_sync_file_to_dataset_task_link_id_fkey"
            columns: ["sync_file_to_dataset_task_link_id"]
            isOneToOne: false
            referencedRelation: "task_link"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "synced_file_synced_folder_id_fkey"
            columns: ["synced_folder_id"]
            isOneToOne: false
            referencedRelation: "synced_folder"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "synced_file_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          }
        ]
      }
      synced_file_dataset_metadata: {
        Row: {
          dataset_metadata_id: number
          has_unprocessed_version: boolean
          id: number
          last_processed_version: string | null
          sync_file_to_dataset_task_link_id: number | null
          synced_file_id: number
          user_id: string
        }
        Insert: {
          dataset_metadata_id: number
          has_unprocessed_version?: boolean
          id?: number
          last_processed_version?: string | null
          sync_file_to_dataset_task_link_id?: number | null
          synced_file_id: number
          user_id: string
        }
        Update: {
          dataset_metadata_id?: number
          has_unprocessed_version?: boolean
          id?: number
          last_processed_version?: string | null
          sync_file_to_dataset_task_link_id?: number | null
          synced_file_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "synced_file_dataset_metadata_dataset_metadata_id_fkey"
            columns: ["dataset_metadata_id"]
            isOneToOne: false
            referencedRelation: "dataset_metadata"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "synced_file_dataset_metadata_sync_file_to_dataset_task_lin_fkey"
            columns: ["sync_file_to_dataset_task_link_id"]
            isOneToOne: false
            referencedRelation: "task_link"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "synced_file_dataset_metadata_synced_file_id_fkey"
            columns: ["synced_file_id"]
            isOneToOne: false
            referencedRelation: "synced_file"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "synced_file_dataset_metadata_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          }
        ]
      }
      synced_folder: {
        Row: {
          id: number
          name: string
          project_id: string
          remote_id: string
          source: string
          sync_folder_task_link_id: number | null
          user_id: string
        }
        Insert: {
          id?: number
          name: string
          project_id: string
          remote_id: string
          source: string
          sync_folder_task_link_id?: number | null
          user_id: string
        }
        Update: {
          id?: number
          name?: string
          project_id?: string
          remote_id?: string
          source?: string
          sync_folder_task_link_id?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "synced_folder_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "synced_folder_sync_folder_task_link_id_fkey"
            columns: ["sync_folder_task_link_id"]
            isOneToOne: false
            referencedRelation: "task_link"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "synced_folder_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
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
            isOneToOne: false
            referencedRelation: "chemical"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "synonym_protein_id_fkey"
            columns: ["protein_id"]
            isOneToOne: false
            referencedRelation: "protein"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "synonym_reaction_id_fkey"
            columns: ["reaction_id"]
            isOneToOne: false
            referencedRelation: "reaction"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "synonym_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "species"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "task_link_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          }
        ]
      }
      user: {
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
            foreignKeyName: "user_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
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
            isOneToOne: false
            referencedRelation: "user"
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
      create_data_jwt: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_schema_name: {
        Args: {
          project_id: string
        }
        Returns: string
      }
      generate_username: {
        Args: {
          num_digits?: number
        }
        Returns: string
      }
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
      jsonschema_is_valid: {
        Args: {
          schema: Json
        }
        Returns: boolean
      }
      jsonschema_validation_errors: {
        Args: {
          schema: Json
          instance: Json
        }
        Returns: unknown
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

