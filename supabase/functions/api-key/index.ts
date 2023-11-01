import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.4.1";
import { get as _get } from "https://raw.githubusercontent.com/lodash/lodash/4.17.21-es/lodash.js";

import { ApiFactory } from "https://deno.land/x/aws_api@v0.7.0/client/mod.ts";
import { APIGateway } from "https://aws-api.deno.dev/v0.3/services/apigateway.ts";

import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
if (!supabaseUrl) throw Error("Missing SUPABASE_URL");
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
if (!supabaseAnonKey) throw Error("Missing SUPABASE_ANON_KEY");

serve(async (req: Request): Promise<Response> => {
  try {
    // handle CORS
    if (req.method === "OPTIONS") {
      return new Response(JSON.stringify({ status: "ok" }), {
        headers: corsHeaders,
      });
    }

    const gateway = new ApiFactory({ region: "us-west-1" }).makeNew(APIGateway);

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
      console.log(`Getting key for ${user.id}`);
      const apiKeys = await gateway.getApiKeys({
        nameQuery: user.id,
        includeValues: true,
      });
      const items = _get(apiKeys, "items", []);
      if (items.length === 0) {
        return new Response(JSON.stringify({ status: "not found" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        });
      }
      const result = _get(items, [0]);
      return new Response(
        JSON.stringify({
          id: result.id,
          name: result.name,
          value: result.value,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } else if (req.method === "DELETE") {
      console.log(`Revoking keys for ${user.id}`);
      // Clean up all matching keys
      const apiKeys = await gateway.getApiKeys({
        nameQuery: user.id,
      });
      const items = _get(apiKeys, ["items"], []);
      for (let i = 0; i < items.length; i++) {
        const apiKey = _get(items, [i, "id"]);
        await gateway.deleteApiKey({ apiKey });
      }
      console.log(`Deleted ${items.length} keys for user ${user.id}`);
      return new Response(JSON.stringify({ status: "ok" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else if (req.method === "POST") {
      console.log(`Creating key for ${user.id}`);
      // create the key
      const { name, id, value } = await gateway.createApiKey({
        name: user.id,
        enabled: true,
      });
      if (!id) throw Error("Key `id` not found");
      // // get usage plan
      const usagePlans = await gateway.getUsagePlans();
      const usagePlanId = _get(usagePlans, ["items", 0, "id"]);
      if (!usagePlanId) throw Error("Could not get usage plan");
      // // associate it with the key
      await gateway.createUsagePlanKey({
        usagePlanId,
        keyType: "API_KEY",
        keyId: id,
      });
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
  return new Response(JSON.stringify({ status: "error" }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 500,
  });
});
