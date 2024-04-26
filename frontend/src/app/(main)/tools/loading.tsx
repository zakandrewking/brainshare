import Container from "@/components/ui/container";
import { DelayedLoadingSpinner } from "@/components/ui/loading";

export default function Loading() {
  return (
    <Container>
      <DelayedLoadingSpinner />
    </Container>
  );
}
