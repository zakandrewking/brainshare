import { redirect } from "next/navigation";

import { getUser } from "@/utils/supabase/server";
import { logInRedirect } from "@/utils/url";

import TypeGenerator from "./type-generator";

export default async function TypeGeneratorPage() {
  const { user } = await getUser();
  if (!user) {
    redirect(logInRedirect("/type-generator"));
  }
  return <TypeGenerator />;
}
