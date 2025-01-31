import { NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";
import { decodeRedirect } from "@/utils/url";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirectCode = searchParams.get("redirectCode");
  const redirectPath =
    redirectCode && redirectCode !== "" ? decodeRedirect(redirectCode) : "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${redirectPath}`);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
