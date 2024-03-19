/// <reference lib="deno.ns" />
// TODO Deno VSCode is not working. the line above was supposed to help. If
// this continues, would be worth getting support or switching to another
// function provider (something not deno)

/**
 * Retrieve an access token for Google APIs. If the user has not authorized
 * the app, returns a redirect URL to the Google OAuth consent screen. POST to
 * exchange a code for an access token. DELETE to set needs_reconnect = true.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { OAuth2Client } from "https://deno.land/x/oauth2_client@v1.0.2/mod.ts";
import {
  createClient,
  SupabaseClient,
} from "https://esm.sh/@supabase/supabase-js@2.39.7";

import { Database } from "../_shared/database.types.ts";
import makeResponse from "../_shared/makeResponse.ts";

// load env variables
const google_oauth_client_id = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID");
if (!google_oauth_client_id) throw Error("Missing GOOGLE_OAUTH_CLIENT_ID");
const google_oauth_client_secret = Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET");
if (!google_oauth_client_secret)
  throw Error("Missing GOOGLE_OAUTH_CLIENT_SECRET");
const redirectUri = Deno.env.get("GOOGLE_OAUTH_REDIRECT_URL");
if (!redirectUri) throw Error("Missing GOOGLE_OAUTH_REDIRECT_URL");
const supabase_url = Deno.env.get("SUPABASE_URL");
if (!supabase_url) throw Error("Missing SUPABASE_URL");
const supabase_anon_key = Deno.env.get("SUPABASE_ANON_KEY");
if (!supabase_anon_key) throw Error("Missing SUPABASE_ANON_KEY");
const supabase_service_role_key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
if (!supabase_service_role_key)
  throw Error("Missing SUPABASE_SERVICE_ROLE_KEY");

async function generateTokensForCode(
  client: OAuth2Client,
  supabaseAdmin: SupabaseClient,
  authResponseUri: string,
  userId: string
): Promise<string> {
  // get state from db
  const { data, error } = await supabaseAdmin
    .from("oauth2_connection")
    .select("state")
    .eq("user_id", userId)
    .eq("name", "google")
    .maybeSingle();
  if (error || !data) {
    console.log(error);
    throw Error("Failed to get state from db");
  }

  // get tokens from code
  const tokens = await client.code.getToken(authResponseUri, {
    state: data.state,
  });

  if (!tokens.refreshToken) throw Error("Missing refresh token");

  // save tokens to db
  const { error: saveError } = await supabaseAdmin
    .from("oauth2_connection")
    .upsert(
      {
        name: "google",
        user_id: userId,
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken!,
        token_type: tokens.tokenType,
        expires_at: new Date(Date.now() + tokens.expiresIn! * 1000),
        // scope may be undefined, in which case the previous scopes are kept
        ...(tokens.scope ? { scope: tokens.scope } : {}),
        needs_reconnect: false,
        state: null,
      },
      { onConflict: "name, user_id", ignoreDuplicates: false }
    )
    .select("*")
    .single();
  if (saveError) {
    console.log(saveError);
    throw Error("Failed to save tokens to db");
  }
  return tokens.accessToken;
}

/**
 * Generate an auth URL
 */
async function generateAuthorizationUri(
  client: OAuth2Client,
  supabaseAdmin: SupabaseClient,
  userId: string
): Promise<string> {
  // Generate random state
  const state = (Math.random() + 1).toString(36).substring(7);

  // save state to db
  const { error: errorState } = await supabaseAdmin
    .from("oauth2_connection")
    .upsert(
      { name: "google", user_id: userId, state },
      { onConflict: "name, user_id", ignoreDuplicates: false }
    )
    .select("*")
    .single();
  if (errorState) {
    console.log(errorState);
    throw Error("Failed to save state to db");
  }

  // generate auth url
  const { uri } = await client.code.getAuthorizationUri({
    disablePkce: true,
    state,
  });

  // add access_type and include_granted_scopes
  const finalUri = `${uri}&prompt=consent&access_type=offline&include_granted_scopes=true`;

  console.log(`Generated finalUri ${finalUri}`);

  return finalUri;
}

/**
 * Refresh the access token and save it to the database; returns an access
 * token. If the return is null, then the user needs to reconnect.
 */
async function refresh(
  client: OAuth2Client,
  supabaseAdmin: SupabaseClient,
  refreshToken: string,
  userId: string
): Promise<string | null> {
  let refreshedTokens;
  try {
    console.log("Refreshing access token");
    refreshedTokens = await client.refreshToken.refresh(refreshToken);
  } catch (_) {
    // If the refresh token is invalid, mark that we need to reconnect
    const { error } = await supabaseAdmin
      .from("oauth2_connection")
      .upsert(
        {
          name: "google",
          user_id: userId,
          needs_reconnect: true,
        },
        { onConflict: "name, user_id", ignoreDuplicates: false }
      )
      .select("*")
      .single();
    if (error) {
      console.log(error);
      throw Error("Failed to update connection with needs_reconnect: true");
    }
    return null;
  }

  if (
    !refreshedTokens.accessToken ||
    !refreshedTokens.tokenType ||
    !refreshedTokens.expiresIn
  ) {
    console.log(refreshedTokens);
    throw Error("Missing required fields in refreshed tokens");
  }

  console.log("Saving refreshed tokens to db");
  const { error } = await supabaseAdmin
    .from("oauth2_connection")
    .upsert(
      {
        name: "google",
        user_id: userId,
        access_token: refreshedTokens.accessToken,
        token_type: refreshedTokens.tokenType,
        expires_at: new Date(Date.now() + refreshedTokens.expiresIn! * 1000),
        // scope may be undefined, in which case the previous scopes are kept
        ...(refreshedTokens.scope ? { scope: refreshedTokens.scope } : {}),
        // refresh token may be undefined, in which case the previous
        // refresh token is kept
        refresh_token: refreshedTokens.refreshToken || refreshToken,
      },
      { onConflict: "name, user_id", ignoreDuplicates: false }
    )
    .select("*")
    .single();
  if (error) {
    console.log(error);
    throw Error("Failed to save refreshed tokens to db");
  }

  return refreshedTokens.accessToken;
}

async function setNeedsReconnect(
  supabaseAdmin: SupabaseClient,
  userId: string
): Promise<void> {
  try {
    await supabaseAdmin.from("oauth2_connection").upsert(
      {
        name: "google",
        user_id: userId,
        needs_reconnect: true,
      },
      { onConflict: "name, user_id", ignoreDuplicates: false }
    );
  } catch (error) {
    console.log(error);
    throw Error("Failed to update connection with needs_reconnect: true");
  }
}

serve(async (req: Request): Promise<Response> => {
  try {
    // handle CORS
    if (req.method === "OPTIONS") return makeResponse({});

    const supabase = createClient<Database>(supabase_url, supabase_anon_key, {
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

      const supabaseAdmin = createClient<Database>(
        supabase_url,
      supabase_service_role_key
    );

    // Create OAuth2 client for Google
    const client = new OAuth2Client({
      clientId: google_oauth_client_id,
      clientSecret: google_oauth_client_secret,
      authorizationEndpointUri: "https://accounts.google.com/o/oauth2/v2/auth",
      redirectUri,
      tokenUri: "https://oauth2.googleapis.com/token",
      defaults: {
        scope: ["https://www.googleapis.com/auth/drive"],
      },
    });

    // GET retrieves the access token, refreshing if it will expire soon
    if (req.method === "GET") {
      console.log(`Checking for Google Access Token for user: ${user.id}`);
      const { data: connection, error } = await supabaseAdmin
        .from("oauth2_connection")
        .select("*")
        .eq("user_id", user.id)
        .eq("name", "google")
        .maybeSingle();
      if (error) {
        console.log(error);
        throw Error("Failed to get tokens from db");
      }

      if (connection?.needs_reconnect) {
        console.log("User needs to reconnect; returning auth url");
        const authorizationUri = await generateAuthorizationUri(
          client,
          supabaseAdmin,
          user.id
        );
        if (new URL(req.url).searchParams.get("generateUri")) {
          console.log("No tokens, so generating auth url");
          return makeResponse({ authorizationUri });
        } else {
          console.log("No tokens");
          return makeResponse({ noTokens: true });
        }
      } else if (connection?.access_token) {
        if (!connection.expires_at) {
          console.log("No expiry date, so generating new tokens");
          await setNeedsReconnect(supabaseAdmin, user.id);
          return makeResponse({ needsReconnect: true });
        }
        if (!connection.refresh_token) {
          console.log("No refresh token, so generating new tokens");
          await setNeedsReconnect(supabaseAdmin, user.id);
          return makeResponse({ needsReconnect: true });
        }
        if (
          new Date(connection.expires_at) < new Date(Date.now() + 5 * 60 * 1000)
        ) {
          console.log(
            "Token is expiring within 5 minutes, so refreshing tokens"
          );
          const accessToken = await refresh(
            client,
            supabaseAdmin,
            connection.refresh_token,
            user.id
          );
          if (accessToken === null) {
            await setNeedsReconnect(supabaseAdmin, user.id);
            return makeResponse({ needsReconnect: true });
          } else {
            return makeResponse({ accessToken });
          }
        }

        console.log("Access token is valid");
        return makeResponse({ accessToken: connection.access_token }, 200);
      } else {
        if (new URL(req.url).searchParams.get("generateUri")) {
          console.log("No tokens, so generating auth url");
          const authorizationUri = await generateAuthorizationUri(
            client,
            supabaseAdmin,
            user.id
          );
          return makeResponse({ authorizationUri });
        } else {
          console.log("No tokens");
          return makeResponse({ noTokens: true });
        }
      }

      // POST to get access token from code
    } else if (req.method === "POST") {
      console.log("Getting access token from code");
      const { authResponseUri } = await req.json();
      const accessToken = await generateTokensForCode(
        client,
        supabaseAdmin,
        authResponseUri,
        user.id
      );
      console.log("Got access token from code");
      return makeResponse({ accessToken });
    } else if (req.method === "DELETE") {
      console.log("Setting Google connection to needs_reconnect = true");
      await setNeedsReconnect(supabaseAdmin, user.id);
      return makeResponse({ needsReconnect: true });
    } else {
      return makeResponse({ error: `Unsupported method ${req.method}` }, 400);
    }
  } catch (error) {
    console.error(error);
    return makeResponse({ error: "An unexpected error occurred" }, 500);
  }
});
