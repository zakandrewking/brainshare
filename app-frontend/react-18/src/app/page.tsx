import { Button } from "brainshare-components/button";
import Container from "brainshare-components/container";
import { H1 } from "brainshare-components/typography";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow flex flex-col">
        <Container>
          <H1>Home</H1>
          <Button variant="default">Log In</Button>
        </Container>
      </main>
    </div>
  );
}
