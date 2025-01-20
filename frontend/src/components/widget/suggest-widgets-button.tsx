"use client";

import React from "react";

import { PlusCircle } from "lucide-react";

import { suggestWidgets } from "@/actions/suggest-widgets";
import useIsSSR from "@/hooks/use-is-ssr";
import { useUser } from "@/utils/supabase/client";

import { Button } from "../ui/button";

export default function SuggestWidgetsButton({}: {}) {
  const { user } = useUser();
  const isSSR = useIsSSR();

  const [state, formAction, isPending] = React.useActionState(suggestWidgets, {
    error: null,
  });

  return (
    <form action={formAction}>
      <Button type="submit" disabled={isPending || !user || isSSR}>
        <PlusCircle className="h-4 w-4 mr-2" />
        Suggest Widgets
      </Button>
    </form>
  );
}
