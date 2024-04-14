// Based on
// https://github.com/logto-io/js/tree/master/packages/next-app-dir-sample

// not loving logto -- eu only, not clear that it's widely used. next let's try
// clerk, which does have a basic oauth2 flow
// https://clerk.com/docs/advanced-usage/clerk-idp

import LogtoClient from "@logto/next/edge";

export const logtoClient = new LogtoClient({
  baseUrl: process.env.FRONTEND_URL!,
  endpoint: process.env.LOGTO_ENDPOINT!,
  appId: process.env.LOGTO_APP_ID!,
  appSecret: process.env.LOGTO_APP_SECRET!,
  cookieSecret: process.env.LOGTO_COOKIE_SECRET!,
  cookieSecure: process.env.NODE_ENV === "production",
  // Optional fields for RBAC
  //   resources: process.env.RESOURCES?.split(","),
  //   scopes: process.env.SCOPES?.split(","),
});
