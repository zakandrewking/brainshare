"use server";

import OpenAI from "openai";
import { z } from "zod";

import { getUser } from "@/utils/supabase/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const widgetSuggestionSchema = z.object({
  name: z.string(),
  description: z.string(),
  type: z.enum(["chart", "table", "list"]),
});

type WidgetSuggestion = z.infer<typeof widgetSuggestionSchema>;

export async function suggestWidgets(prevState: { error: string | null }) {
  const { supabase, user } = await getUser();
  if (!user) throw new Error("Not authenticated");

  await new Promise((resolve) => setTimeout(resolve, 1000));

  return { error: null };
}
