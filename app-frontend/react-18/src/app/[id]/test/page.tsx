import React from "react";

import Count from "./Count";

export function generateStaticParams() {
  return [{ id: "1" }];
}

export default function Test({ params: { id } }: { params: { id: string } }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        fontSize: "2rem",
        gap: "1rem",
      }}
    >
      <div>ID: {id}</div>
      <Count />
    </div>
  );
}
