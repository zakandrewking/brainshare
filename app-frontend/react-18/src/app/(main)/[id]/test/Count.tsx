"use client";

import React, { useState } from "react";

export default function Count() {
  const [state, setState] = useState(0);
  return (
    <>
      <button onClick={() => setState(state + 1)}>increment</button>
      <div>Test {state}</div>
    </>
  );
}
