import type { MetaFunction } from "@remix-run/node";
import { ClientOnly } from "remix-utils/client-only";

export const meta: MetaFunction = () => {
  return [
    { title: "Brainshare" },
    { name: "description", content: "Welcome to Brainshare!" },
  ];
};

export default function Index() {
  return (
    <div>
      <h1>Welcome to Remix</h1>
      <ClientOnly fallback={<div>skeleton</div>}>
        {() => <DoSomethingExpensive />}
      </ClientOnly>
    </div>
  );
}

function DoSomethingExpensive() {
  console.log("test");

  const x = 1;
  const y = 2;

  // breakpoints really don't work well yet in vite
  // https://github.com/vitejs/vite/issues/12265

  console.log(x, y);

  return <div>expensive</div>;
}
