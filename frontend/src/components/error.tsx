import { toast } from "sonner";

import Container from "./ui/container";

export function showError(
  message: string = "Something went wrong. Please try again soon."
) {
  toast.error(message);
}

export function ErrorMessage({
  message = "Something went wrong. Please try again soon.",
}: {
  message?: string;
} = {}) {
  return <Container>{message}</Container>;
}
