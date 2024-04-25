import { toast } from "sonner";

export function showError(
  message: string = "Something went wrong. Please try again soon."
) {
  toast.error(message);
}
