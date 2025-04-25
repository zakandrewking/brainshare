"use client";

import {
  FloatingToolbar,
  useLiveblocksExtension,
} from "@liveblocks/react-tiptap";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

import Threads from "./Threads";

export default function Editor() {
  // TODO we can pull out the yjs provider from here to mess around
  // https://github.com/liveblocks/liveblocks/blob/2e54b968efc5334babcdc21963499f1215f8312e/packages/liveblocks-react-tiptap/src/LiveblocksExtension.ts#L160
  const liveblocks = useLiveblocksExtension();

  const editor = useEditor({
    extensions: [
      liveblocks,
      StarterKit.configure({
        // The Liveblocks extension comes with its own history handling
        history: false,
      }),
    ],
    immediatelyRender: false,
  });

  return (
    <div>
      <EditorContent editor={editor} className="editor" />
      <Threads editor={editor} />
      <FloatingToolbar editor={editor} />
    </div>
  );
}
