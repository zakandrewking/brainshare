import { corsHeaders } from "../_shared/cors.ts";

// deno-lint-ignore no-explicit-any
export default function makeResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });
}
