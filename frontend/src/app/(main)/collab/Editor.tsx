"use client";

import {
  Bold,
  Columns3,
  Combine,
  FlipHorizontal,
  FlipVertical,
  Heading2,
  Italic,
  Minus,
  Pilcrow,
  Rows3,
  Split,
  Strikethrough,
  Table as TableIcon,
  Trash2,
} from "lucide-react";

import { useLiveblocksExtension } from "@liveblocks/react-tiptap";
import Table from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import { NodeSelection } from "@tiptap/pm/state";
import {
  BubbleMenu,
  Editor as TiptapEditor,
  EditorContent,
  useEditor,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import Threads from "./Threads";

const EditorToolbar = ({ editor }: { editor: TiptapEditor | null }) => {
  if (!editor) return null;

  const isTableSelection =
    editor.state.selection instanceof NodeSelection &&
    editor.state.selection.node.type.name === "table";

  const isTableContext =
    editor.isActive("table") ||
    editor.isActive("tableRow") ||
    editor.isActive("tableCell") ||
    editor.isActive("tableHeader") ||
    isTableSelection;

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{ duration: 100, placement: "top-start" }}
      className="flex flex-wrap space-x-1 rounded-md border border-input bg-background p-1 shadow-md"
      shouldShow={({ editor, view, state, oldState, from, to }) => {
        const { doc, selection } = state;
        const { empty } = selection;
        const isNodeSel = selection instanceof NodeSelection;

        if (!empty || isTableContext) {
          if (!empty && from !== to && !isTableContext && !isNodeSel) {
            try {
              let startNode = doc.resolve(from).nodeAfter;
              let endNode = doc.resolve(to).nodeBefore;
              if (
                startNode &&
                endNode &&
                startNode.type !== endNode.type &&
                startNode.isBlock &&
                endNode.isBlock
              ) {
                return false;
              }
            } catch (e) {
              console.warn(
                "Error resolving nodes for BubbleMenu visibility:",
                e
              );
            }
          }
          return true;
        }

        return false;
      }}
    >
      {isTableContext ? (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().addRowBefore().run()}
            disabled={!editor.can().addRowBefore()}
            title="Add Row Before"
          >
            <Rows3 className="h-4 w-4" />
            <span className="sr-only">Add Row Before</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().addRowAfter().run()}
            disabled={!editor.can().addRowAfter()}
            title="Add Row After"
          >
            <Rows3 className="h-4 w-4 rotate-180" />
            <span className="sr-only">Add Row After</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().deleteRow().run()}
            disabled={!editor.can().deleteRow()}
            title="Delete Row"
            className="text-destructive hover:bg-destructive/10"
          >
            <Rows3 className="h-4 w-4" />
            <Minus className="absolute h-2 w-2" />
            <span className="sr-only">Delete Row</span>
          </Button>
          <Separator orientation="vertical" className="h-auto mx-1" />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().addColumnBefore().run()}
            disabled={!editor.can().addColumnBefore()}
            title="Add Column Before"
          >
            <Columns3 className="h-4 w-4" />
            <span className="sr-only">Add Column Before</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().addColumnAfter().run()}
            disabled={!editor.can().addColumnAfter()}
            title="Add Column After"
          >
            <Columns3 className="h-4 w-4 rotate-180" />
            <span className="sr-only">Add Column After</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().deleteColumn().run()}
            disabled={!editor.can().deleteColumn()}
            title="Delete Column"
            className="text-destructive hover:bg-destructive/10"
          >
            <Columns3 className="h-4 w-4" />
            <Minus className="absolute h-2 w-2" />
            <span className="sr-only">Delete Column</span>
          </Button>
          <Separator orientation="vertical" className="h-auto mx-1" />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().mergeOrSplit().run()}
            disabled={!editor.can().mergeOrSplit()}
            title="Merge/Split Cells"
          >
            {editor.can().mergeCells() ? (
              <Combine className="h-4 w-4" />
            ) : (
              <Split className="h-4 w-4" />
            )}
            <span className="sr-only">Merge/Split Cells</span>
          </Button>
          <Separator orientation="vertical" className="h-auto mx-1" />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeaderRow().run()}
            disabled={!editor.can().toggleHeaderRow()}
            title="Toggle Header Row"
          >
            <FlipVertical className="h-4 w-4" />
            <span className="sr-only">Toggle Header Row</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeaderColumn().run()}
            disabled={!editor.can().toggleHeaderColumn()}
            title="Toggle Header Column"
          >
            <FlipHorizontal className="h-4 w-4" />
            <span className="sr-only">Toggle Header Column</span>
          </Button>
          <Separator orientation="vertical" className="h-auto mx-1" />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().deleteTable().run()}
            disabled={!editor.can().deleteTable()}
            title="Delete Table"
            className="text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete Table</span>
          </Button>
        </>
      ) : (
        <>
          <Button
            variant={editor.isActive("bold") ? "secondary" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive("italic") ? "secondary" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive("strike") ? "secondary" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            title="Strikethrough"
          >
            <Strikethrough className="h-4 w-4" />
          </Button>
          <Separator orientation="vertical" className="h-auto mx-1" />
          <Button
            variant={
              editor.isActive("heading", { level: 2 }) ? "secondary" : "ghost"
            }
            size="sm"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            title="Heading"
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive("paragraph") ? "secondary" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().setParagraph().run()}
            title="Paragraph"
          >
            <Pilcrow className="h-4 w-4" />
          </Button>
          <Separator orientation="vertical" className="h-auto mx-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              editor
                .chain()
                .focus()
                .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                .run()
            }
            title="Insert Table"
          >
            <TableIcon className="h-4 w-4" />
            <span className="sr-only">Insert Table</span>
          </Button>
        </>
      )}
    </BubbleMenu>
  );
};

export default function Editor() {
  const liveblocks = useLiveblocksExtension();

  const editor = useEditor({
    extensions: [
      liveblocks,
      StarterKit.configure({
        history: false,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    immediatelyRender: false,
  });

  return (
    <div className="relative">
      <EditorToolbar editor={editor} />
      <EditorContent
        editor={editor}
        className="editor prose dark:prose-invert max-w-none"
      />
      <Threads editor={editor} />
    </div>
  );
}
