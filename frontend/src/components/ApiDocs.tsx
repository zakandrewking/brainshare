import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

if (process.env.REACT_APP_ANON_KEY === undefined)
  throw Error("Missing environment variable REACT_APP_ANON_KEY");
const anon_key = process.env.REACT_APP_ANON_KEY;

// TODO swap localhost:3000 for the real thing in a supabase function

export default function ApiDocs() {
  return (
    <SwaggerUI
      url={`${process.env.REACT_APP_API_URL}/rest/v1/`}
      showMutatedRequest={false}
      requestInterceptor={(req) => ({
        ...req,
        headers: {
          apikey: anon_key,
        },
      })}
    />
  );
}
