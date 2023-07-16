// Supabase does a great job of generating types for us, for relational data
// models (see database.types.ts). However, we really want to use jsonb and
// pg_jsonschema for fast lookups of certain data types, and we also want to
// have type checks in frontend code to work quickly with those. It would be
// neat to introspect the pg_jsonschema CHECK statements and generate some
// typescript types from them. For now, we'll just write them by hand.

import { Database } from "./database.types";

export interface NodeDataJson {
  [key: string]: any;
}

export interface DefinitionOptionsJson {
  bucket?: string;
  bucketKey?: string;
  buttonText?: string;
  dataKey?: string;
  displayName?: string;
  gridSize?: number;
  height?: number;
  linkTemplate?: string;
  nameKey?: string;
  pathTemplate?: string;
  sizeKeyBytes?: string;
  width?: number;
  optionsTable?: {
    [key: string]: { nameKey?: string; linkTemplate?: string };
  };
}

export type DatabaseExtended = Database & {
  public: {
    Tables: {
      node: Database["public"]["Tables"]["node"] & {
        Row: Database["public"]["Tables"]["node"]["Row"] & {
          data: NodeDataJson;
        };
      };
      definition: Database["public"]["Tables"]["definition"] & {
        Row: Database["public"]["Tables"]["definition"]["Row"] & {
          options: DefinitionOptionsJson;
        };
      };
    };
  };
};
