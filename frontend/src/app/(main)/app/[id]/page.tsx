/**
 * Design spec: Load a single resource on server and extend with SWR on client
 */

import { notFound } from "next/navigation";

import { ErrorMessage } from "@/components/error";
import getApp from "@/swr/getApp";
import { getSupabase } from "@/utils/supabase/supabaseServer";

import AppWrapper from "./AppWrapper";

export default async function App({
  params: { id },
}: {
  params: { id: string };
}) {
  const supabase = await getSupabase();
  const { app, error } = await getApp(id, supabase);
  if (app === null) throw notFound();
  if (error) return ErrorMessage();
  return <AppWrapper app={app} />;
}
