import React from "react";

import Editor from "./Editor";
import Room from "./Room";

export default function CollabPage() {
  return (
    <div className="p-8">
      <Room>
        <Editor />
      </Room>
    </div>
  );
}
