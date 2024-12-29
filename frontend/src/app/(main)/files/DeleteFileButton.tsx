"use client";

import { useTransition } from "react";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";

export default function DeleteFileButton({
  fileId,
  className,
}: {
  fileId: number;
  className?: string;
}) {
  const supabase = createClient();

  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = async () => {
    const { error } = await supabase
      .from("file")
      .delete()
      .match({ id: fileId });

    if (error) {
      throw new Error(error.message);
    }

    startTransition(() => {
      // Refresh the current route and fetch new data from the server without
      // losing client-side browser or React state. This pattern works, but it's
      // not really compatible with client side fetching. Need to choose one or
      // the other in each case.
      router.refresh();
    });
  };

  return (
    <Button
      onClick={handleDelete}
      variant="ghost"
      size="icon-sm"
      className={className}
    >
      <X />
    </Button>
  );
}
