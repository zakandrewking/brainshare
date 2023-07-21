alter table "public"."definition" drop constraint "definition_options_check";

alter table "public"."definition" add constraint "definition_options_check" CHECK (jsonb_matches_schema('{
    "type": "object",
    "properties": {
      "bucket": {"type": "string"},
      "bucketKey": {"type": "string"},
      "buttonText": {"type": "string"},
      "dataKey": {"type": "string"},
      "displayName": {"type": "string"},
      "gridSize": {"type": "number"},
      "height": {"type": "number"},
      "linkTemplate": {"type": "string"},
      "nameTemplate": {"type": "string"},
      "pathTemplate": {"type": "string"},
      "sizeKeyBytes": {"type": "string"},
      "width": {"type": "number"},
      "optionsTable": {
        "type": "object",
        "patternProperties": {
          "^[a-zA-Z0-9_]+$": {
            "type": "object",
            "properties": {
              "nameKey": {"type": "string"},
              "linkTemplate": {"type": "string"}
            },
            "additionalProperties": false
          }
        }
      }
    },
    "additionalProperties": false
  }'::json, options)) not valid;

alter table "public"."definition" validate constraint "definition_options_check";


