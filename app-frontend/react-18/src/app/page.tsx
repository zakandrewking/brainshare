import Container from "brainshare-components/container";

import HomeView from "./HomeView";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow flex flex-col">
        <Container>
          <HomeView />
        </Container>
      </main>
    </div>
  );
}
