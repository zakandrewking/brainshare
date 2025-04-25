"use client";

import React from "react";

import { EditorProvider } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";

const content = `
<p>Hello World</p>
`;

const extensions = [StarterKit.configure({})];

export default function CollabPage() {
  return (
    <div className="flex h-full w-full flex-col p-8">
      <EditorProvider
        content={content}
        extensions={extensions}
      ></EditorProvider>
    </div>
  );
}
