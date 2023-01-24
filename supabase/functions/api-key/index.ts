// TODO clean up keys that have been revoked but are still in the DB
// TODO clean up keys that are active but marked deleted in the DB

//github.com/bahrmichael/trade-game-backend/blob/ab4e29987f8e3d1bf8d955a6e1360d9ff2c054b1/src/functions/createApiKeyFinish/handler.ts

https: import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

import {
  APIGatewayClient,
  CreateApiKeyCommand,
  DeleteApiKeyCommand,
} from "https://deno.land/x/aws_sdk@v3.32.0-1/client-api-gateway/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.4.1";
import { get as _get } from "https://raw.githubusercontent.com/lodash/lodash/4.17.21-es/lodash.js";

serve(async (req: Request): Promise<Response> => {
  try {
    // handle CORS
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    // Get user auth
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    if (!supabaseUrl) throw Error("Missing SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseAnonKey) throw Error("Missing SUPABASE_ANON_KEY");

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: req.headers.get("Authorization")! },
      },
      db: { schema: "api" },
    });

    // Check auth
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) throw Error(error.message);

    if (req.method === "DELETE") {
      // REVOKE
      // Get the ID
      const taskPattern = new URLPattern({ pathname: "/api-key/:id" });
      const matchingPath = taskPattern.exec(req.url);
      const id = matchingPath ? matchingPath.pathname.groups.id : null;
      if (!id) {
        throw Error("Missing `id`");
      }
      // Mark the key as deleting
      const { data, error } = await supabase
        .from("api_key")
        .update({ status: "deleting" })
        .eq("id", id)
        .select()
        .single();
      if (error) throw Error(error.message);
      // Revoke the key
      const client = new APIGatewayClient({ region: "us-west-1" });
      const command = new DeleteApiKeyCommand({
        id: "5hzap9agv6",
      });
      const response = await client.send(command);
      if (!response) {
        throw Error("Bad response");
      }
      // Mark the key as deleted
      const { error: error2 } = await supabase
        .from("api_key")
        .update({ status: "deleted" })
        .eq("id", id);
      if (error2) throw Error(error2.message);
      // Done!
      return new Response(null, {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else if (req.method === "POST") {
      if (!user) throw Error("Missing user");
      // CREATE
      // Create the ID
      const id = crypto.randomUUID();
      const client = new APIGatewayClient({ region: "us-west-1" });
      const command = new CreateApiKeyCommand({ name: id });
      const response = await client.send(command);
      if (!response || !response.value) {
        throw Error("Bad response");
      }
      // Save to the database
      const record = { id, key: response.value, user_id: user.id };
      const { error } = await supabase.from("api_key").insert(record);
      if (error) throw Error(error.message);
      // Done!
      return new Response(JSON.stringify(record), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: _get(error, ["message"], String(error)) }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
  return new Response(null, {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 500,
  });
});
