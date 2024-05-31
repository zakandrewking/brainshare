/**
 * Design spec: Load a single resource on server and extend with SWR on client
 */

import { notFound } from "next/navigation";

import { ErrorMessage } from "@/components/error";
import { getSupabase } from "@/lib/supabaseServer";
import getApp from "@/swr/getApp";

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
