/**
 * This file was auto-generated by openapi-typescript.
 * Do not make direct changes to the file.
 */

export interface paths {
  "/": {
    get: {
      responses: {
        /** OK */
        200: unknown;
      };
    };
  };
  "/bases": {
    get: {
      parameters: {
        query: {
          id?: parameters["rowFilter.bases.id"];
          name?: parameters["rowFilter.bases.name"];
          storage_file_path?: parameters["rowFilter.bases.storage_file_path"];
          owner?: parameters["rowFilter.bases.owner"];
          dev_port?: parameters["rowFilter.bases.dev_port"];
          created_at?: parameters["rowFilter.bases.created_at"];
          updated_at?: parameters["rowFilter.bases.updated_at"];
          /** Filtering Columns */
          select?: parameters["select"];
          /** Ordering */
          order?: parameters["order"];
          /** Limiting and Pagination */
          offset?: parameters["offset"];
          /** Limiting and Pagination */
          limit?: parameters["limit"];
        };
        header: {
          /** Limiting and Pagination */
          Range?: parameters["range"];
          /** Limiting and Pagination */
          "Range-Unit"?: parameters["rangeUnit"];
          /** Preference */
          Prefer?: parameters["preferCount"];
        };
      };
      responses: {
        /** OK */
        200: {
          schema: definitions["bases"][];
        };
        /** Partial Content */
        206: unknown;
      };
    };
    post: {
      parameters: {
        body: {
          /** bases */
          bases?: definitions["bases"];
        };
        query: {
          /** Filtering Columns */
          select?: parameters["select"];
        };
        header: {
          /** Preference */
          Prefer?: parameters["preferReturn"];
        };
      };
      responses: {
        /** Created */
        201: unknown;
      };
    };
    delete: {
      parameters: {
        query: {
          id?: parameters["rowFilter.bases.id"];
          name?: parameters["rowFilter.bases.name"];
          storage_file_path?: parameters["rowFilter.bases.storage_file_path"];
          owner?: parameters["rowFilter.bases.owner"];
          dev_port?: parameters["rowFilter.bases.dev_port"];
          created_at?: parameters["rowFilter.bases.created_at"];
          updated_at?: parameters["rowFilter.bases.updated_at"];
        };
        header: {
          /** Preference */
          Prefer?: parameters["preferReturn"];
        };
      };
      responses: {
        /** No Content */
        204: never;
      };
    };
    patch: {
      parameters: {
        query: {
          id?: parameters["rowFilter.bases.id"];
          name?: parameters["rowFilter.bases.name"];
          storage_file_path?: parameters["rowFilter.bases.storage_file_path"];
          owner?: parameters["rowFilter.bases.owner"];
          dev_port?: parameters["rowFilter.bases.dev_port"];
          created_at?: parameters["rowFilter.bases.created_at"];
          updated_at?: parameters["rowFilter.bases.updated_at"];
        };
        body: {
          /** bases */
          bases?: definitions["bases"];
        };
        header: {
          /** Preference */
          Prefer?: parameters["preferReturn"];
        };
      };
      responses: {
        /** No Content */
        204: never;
      };
    };
  };
  "/uploaded_files": {
    get: {
      parameters: {
        query: {
          id?: parameters["rowFilter.uploaded_files.id"];
          name?: parameters["rowFilter.uploaded_files.name"];
          owner?: parameters["rowFilter.uploaded_files.owner"];
          object_key?: parameters["rowFilter.uploaded_files.object_key"];
          created_at?: parameters["rowFilter.uploaded_files.created_at"];
          updated_at?: parameters["rowFilter.uploaded_files.updated_at"];
          /** Filtering Columns */
          select?: parameters["select"];
          /** Ordering */
          order?: parameters["order"];
          /** Limiting and Pagination */
          offset?: parameters["offset"];
          /** Limiting and Pagination */
          limit?: parameters["limit"];
        };
        header: {
          /** Limiting and Pagination */
          Range?: parameters["range"];
          /** Limiting and Pagination */
          "Range-Unit"?: parameters["rangeUnit"];
          /** Preference */
          Prefer?: parameters["preferCount"];
        };
      };
      responses: {
        /** OK */
        200: {
          schema: definitions["uploaded_files"][];
        };
        /** Partial Content */
        206: unknown;
      };
    };
    post: {
      parameters: {
        body: {
          /** uploaded_files */
          uploaded_files?: definitions["uploaded_files"];
        };
        query: {
          /** Filtering Columns */
          select?: parameters["select"];
        };
        header: {
          /** Preference */
          Prefer?: parameters["preferReturn"];
        };
      };
      responses: {
        /** Created */
        201: unknown;
      };
    };
    delete: {
      parameters: {
        query: {
          id?: parameters["rowFilter.uploaded_files.id"];
          name?: parameters["rowFilter.uploaded_files.name"];
          owner?: parameters["rowFilter.uploaded_files.owner"];
          object_key?: parameters["rowFilter.uploaded_files.object_key"];
          created_at?: parameters["rowFilter.uploaded_files.created_at"];
          updated_at?: parameters["rowFilter.uploaded_files.updated_at"];
        };
        header: {
          /** Preference */
          Prefer?: parameters["preferReturn"];
        };
      };
      responses: {
        /** No Content */
        204: never;
      };
    };
    patch: {
      parameters: {
        query: {
          id?: parameters["rowFilter.uploaded_files.id"];
          name?: parameters["rowFilter.uploaded_files.name"];
          owner?: parameters["rowFilter.uploaded_files.owner"];
          object_key?: parameters["rowFilter.uploaded_files.object_key"];
          created_at?: parameters["rowFilter.uploaded_files.created_at"];
          updated_at?: parameters["rowFilter.uploaded_files.updated_at"];
        };
        body: {
          /** uploaded_files */
          uploaded_files?: definitions["uploaded_files"];
        };
        header: {
          /** Preference */
          Prefer?: parameters["preferReturn"];
        };
      };
      responses: {
        /** No Content */
        204: never;
      };
    };
  };
  "/rpc/graphql": {
    post: {
      parameters: {
        body: {
          args: {
            /** Format: text */
            query?: string;
            /** Format: text */
            operationName?: string;
            /** Format: jsonb */
            variables?: string;
          };
        };
        header: {
          /** Preference */
          Prefer?: parameters["preferParams"];
        };
      };
      responses: {
        /** OK */
        200: unknown;
      };
    };
  };
}

export interface definitions {
  bases: {
    /**
     * Format: uuid
     * @description Note:
     * This is a Primary Key.<pk/>
     * @default extensions.uuid_generate_v4()
     */
    id: string;
    /** Format: text */
    name: string;
    /** Format: text */
    storage_file_path?: string;
    /** Format: uuid */
    owner?: string;
    /** Format: integer */
    dev_port?: number;
    /**
     * Format: timestamp with time zone
     * @default now()
     */
    created_at?: string;
    /**
     * Format: timestamp with time zone
     * @default now()
     */
    updated_at?: string;
  };
  uploaded_files: {
    /**
     * Format: uuid
     * @default extensions.uuid_generate_v4()
     */
    id: string;
    /** Format: text */
    name?: string;
    /** Format: uuid */
    owner?: string;
    /** Format: text */
    object_key?: string;
    /**
     * Format: timestamp with time zone
     * @default now()
     */
    created_at?: string;
    /**
     * Format: timestamp with time zone
     * @default now()
     */
    updated_at?: string;
  };
}

export interface parameters {
  /**
   * @description Preference
   * @enum {string}
   */
  preferParams: "params=single-object";
  /**
   * @description Preference
   * @enum {string}
   */
  preferReturn: "return=representation" | "return=minimal" | "return=none";
  /**
   * @description Preference
   * @enum {string}
   */
  preferCount: "count=none";
  /** @description Filtering Columns */
  select: string;
  /** @description On Conflict */
  on_conflict: string;
  /** @description Ordering */
  order: string;
  /** @description Limiting and Pagination */
  range: string;
  /**
   * @description Limiting and Pagination
   * @default items
   */
  rangeUnit: string;
  /** @description Limiting and Pagination */
  offset: string;
  /** @description Limiting and Pagination */
  limit: string;
  /** @description bases */
  "body.bases": definitions["bases"];
  /** Format: uuid */
  "rowFilter.bases.id": string;
  /** Format: text */
  "rowFilter.bases.name": string;
  /** Format: text */
  "rowFilter.bases.storage_file_path": string;
  /** Format: uuid */
  "rowFilter.bases.owner": string;
  /** Format: integer */
  "rowFilter.bases.dev_port": string;
  /** Format: timestamp with time zone */
  "rowFilter.bases.created_at": string;
  /** Format: timestamp with time zone */
  "rowFilter.bases.updated_at": string;
  /** @description uploaded_files */
  "body.uploaded_files": definitions["uploaded_files"];
  /** Format: uuid */
  "rowFilter.uploaded_files.id": string;
  /** Format: text */
  "rowFilter.uploaded_files.name": string;
  /** Format: uuid */
  "rowFilter.uploaded_files.owner": string;
  /** Format: text */
  "rowFilter.uploaded_files.object_key": string;
  /** Format: timestamp with time zone */
  "rowFilter.uploaded_files.created_at": string;
  /** Format: timestamp with time zone */
  "rowFilter.uploaded_files.updated_at": string;
}

export interface operations {}

export interface external {}
