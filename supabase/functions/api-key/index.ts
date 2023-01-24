import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.4.1";
import { get as _get } from "https://raw.githubusercontent.com/lodash/lodash/4.17.21-es/lodash.js";

import {
  APIGatewayClient,
  GetApiKeysCommand,
  CreateApiKeyCommand,
  DeleteApiKeyCommand,
  GetUsagePlansCommand,
  CreateUsagePlanKeyCommand,
} from "https://deno.land/x/aws_sdk@v3.32.0-1/client-api-gateway/mod.ts";

import { corsHeaders } from "../_shared/cors.ts";

serve(async (req: Request): Promise<Response> => {
  try {
    // handle CORS
    if (req.method === "OPTIONS") {
      return new Response("OK", { headers: corsHeaders });
    }

    const gateway = new APIGatewayClient({ region: "us-west-1" });

    // Get user auth
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    if (!supabaseUrl) throw Error("Missing SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseAnonKey) throw Error("Missing SUPABASE_ANON_KEY");

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: req.headers.get("Authorization")! },
      },
    });

    // Check auth
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) throw Error(error.message);
    if (!user) throw Error("No user");

    if (req.method === "GET") {
      const apiKeys = await gateway.send(
        new GetApiKeysCommand({
          nameQuery: user.id,
        })
      );
      if (_get(apiKeys, "length", () => 0)() === 0) {
        return new Response("Not found", {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        });
      }
      const apiKey = _get(apiKeys, [0]);
      return new Response(JSON.stringify(apiKey), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else if (req.method === "DELETE") {
      // REVOKE
      await gateway.send(
        new DeleteApiKeyCommand({
          apiKey: user.id,
        })
      );
      return new Response("OK", {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else if (req.method === "POST") {
      // CREATE
      // create the key
      const { name, id, value } = await gateway.send(
        new CreateApiKeyCommand({ name: user.id })
      );
      // get usage plan
      const usagePlans = await gateway.send(new GetUsagePlansCommand({}));
      const usagePlanId = _get(usagePlans, [0, "id"]);
      if (!usagePlanId) throw Error("Could not get usage plan");
      // associate it with the key
      await gateway.send(
        new CreateUsagePlanKeyCommand({
          usagePlanId,
          keyType: "API_KEY",
          keyId: id,
        })
      );
      // lazy create usage plan
      return new Response(JSON.stringify({ name, id, value }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 201,
      });
    }
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: _get(error, "message", String(error)) }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
  return new Response("ERROR", {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 500,
  });
});
