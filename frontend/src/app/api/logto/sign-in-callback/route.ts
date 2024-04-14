import { type NextRequest } from "next/server";

import { logtoClient } from "@/libraries/logto";

export const runtime = "edge";

// Not cached because we use the request argument
export async function GET(request: NextRequest) {
  return logtoClient.handleSignInCallback()(request);
}
