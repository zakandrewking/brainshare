"use client";

import { useTransition } from "react";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import createClient from "@/utils/supabase/client";

export default function DeleteCustomTypeButton({
  typeId,
  className,
  disabled,
}: {
  typeId: number;
  className?: string;
  disabled?: boolean;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // TODO with SSR, we don't have access to session events, so we need to
  // check if the user is authenticated in the client /async/. how can we
  // conveniently handle this in components?

  const handleDelete = async () => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error("Not authenticated");
    }
    const { error } = await supabase
      .from("custom_type")
      .delete()
      .match({ id: typeId, user_id: user.id });

    if (error) {
      throw new Error(error.message);
    }

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
