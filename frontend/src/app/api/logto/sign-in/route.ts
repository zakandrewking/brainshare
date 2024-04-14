import { type NextRequest } from "next/server";

import { logtoClient } from "@/libraries/logto";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  return logtoClient.handleSignIn()(request);
}
