"use client";

import { useTransition } from "react";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import supabase, { useAuth } from "@/utils/supabase/client";

export default function DeleteCustomTypeButton({
  typeId,
  className,
  disabled,
}: {
  typeId: number;
  className?: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { session } = useAuth();

  if (!session?.user) {
    return null;
  }

  const handleDelete = async () => {
    const { error } = await supabase
      .from("custom_type")
      .delete()
      .match({ id: typeId, user_id: session?.user.id });

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
