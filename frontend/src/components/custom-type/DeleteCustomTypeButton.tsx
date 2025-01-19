"use client";

import React from "react";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";

import { dropTypeValues } from "@/actions/custom-type-values";
import { Button } from "@/components/ui/button";
import { createClient, useUser } from "@/utils/supabase/client";

export default function DeleteCustomTypeButton({
  typeId,
  className,
  disabled,
}: {
  typeId: string;
  className?: string;
  disabled?: boolean;
}) {
  const { user } = useUser();
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const supabase = createClient();

  const handleDelete = async () => {
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
      .from("custom_type")
      .delete()
      .match({ id: typeId, user_id: user.id });

    if (error) {
      console.error("Error deleting type", error);
      throw error;
    }

    // TODO drop values from redis
    try {
      await dropTypeValues(typeId);
    } catch (e) {
      // continue; can clean up redis later
      console.error("Error dropping type values", e);
    }

    // refresh the server-side list of types
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <Button
      onClick={handleDelete}
      variant="ghost"
      size="icon-sm"
      className={className}
      disabled={isPending || disabled}
    >
      <X />
    </Button>
  );
}
