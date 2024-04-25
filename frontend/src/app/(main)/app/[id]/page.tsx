import Container from "@/components/ui/container";
import { H3 } from "@/components/ui/typography";

import AppView from "./AppView";

export default function App({ params: { id } }: { params: { id: string } }) {
  // TODO breadcrumbs
  return (
    <Container>
      <H3>App {id}</H3>
      <AppView id={id} />
    </Container>
  );
}
