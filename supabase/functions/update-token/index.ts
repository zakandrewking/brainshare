/**
 * Update an access token and/or refresh token for an oauth provider. These are
 * not accessible directly from the frontend.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

import { Database } from "../_shared/database.types.ts";
import makeResponse from "../_shared/makeResponse.ts";

const supabase_url = Deno.env.get("SUPABASE_URL");
if (!supabase_url) throw Error("Missing SUPABASE_URL");
const supabase_anon_key = Deno.env.get("SUPABASE_ANON_KEY");
if (!supabase_anon_key) throw Error("Missing SUPABASE_ANON_KEY");
const supabase_service_role_key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
if (!supabase_service_role_key)
  throw Error("Missing SUPABASE_SERVICE_ROLE_KEY");

serve(async (req: Request): Promise<Response> => {
  try {
    // handle CORS
    if (req.method === "OPTIONS") {
      return makeResponse({});
    } else if (req.method === "POST") {
      // Start with an authenticated client
      const supabase = createClient<Database>(supabase_url, supabase_anon_key, {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      });

      // Check auth
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) throw userError;

      // OK to upsert with admin client
      const supabaseAdmin = createClient<Database>(
        supabase_url,
        supabase_service_role_key
      );
      const { accessToken, refreshToken, providerName, expiresAt } =
        (await req.json()) as {
          providerName: string;
          accessToken: string;
          refreshToken?: string;
          expiresAt?: string;
        };
      const { error } = await supabaseAdmin.from("oauth2_connection").upsert(
        {
          name: providerName,
          user_id: user.id,
          access_token: accessToken,
          ...(refreshToken && { refresh_token: refreshToken }),
          ...(expiresAt && { expires_at: expiresAt }),
          needs_reconnect: false,
          state: null,
        },
        { onConflict: ["name, user_id"], ignoreDuplicates: false }
      );
      if (refreshToken) {
        console.log(`Saved access token & refresh token for ${providerName}`);
      } else {
        console.log(`Saved access token for ${providerName}`);
      }
      return makeResponse({ status: "ok" });
    } else {
      return makeResponse({ error: "Method not allowed" }, 405);
    }
  } catch (error) {
    console.error(error);
    return makeResponse({ error: "An unexpected error occurred" }, 500);
  }
});
