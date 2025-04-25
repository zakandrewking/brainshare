"use client";

import {
  ArrowDownSquare,
  ArrowLeftSquare,
  ArrowRightSquare,
  ArrowUpSquare,
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
  Editor as TiptapEditor,
  EditorContent,
  useEditor,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/utils/tailwind";

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
    <TooltipProvider delayDuration={0}>
      <div className="flex flex-wrap items-center gap-1 rounded-md border border-input bg-transparent p-1 mb-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={editor.isActive("bold") ? "secondary" : "ghost"}
              size="sm"
              onClick={() => editor.chain().focus().toggleBold().run()}
              disabled={!editor.can().chain().focus().toggleBold().run()}
            >
              <Bold className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Bold</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={editor.isActive("italic") ? "secondary" : "ghost"}
              size="sm"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              disabled={!editor.can().chain().focus().toggleItalic().run()}
            >
              <Italic className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Italic</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={editor.isActive("strike") ? "secondary" : "ghost"}
              size="sm"
              onClick={() => editor.chain().focus().toggleStrike().run()}
              disabled={!editor.can().chain().focus().toggleStrike().run()}
            >
              <Strikethrough className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Strikethrough</TooltipContent>
        </Tooltip>
        <Separator orientation="vertical" className="h-6 mx-1" />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={
                editor.isActive("heading", { level: 2 }) ? "secondary" : "ghost"
              }
              size="sm"
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
              disabled={
                !editor.can().chain().focus().toggleHeading({ level: 2 }).run()
              }
            >
              <Heading2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Heading</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={editor.isActive("paragraph") ? "secondary" : "ghost"}
              size="sm"
              onClick={() => editor.chain().focus().setParagraph().run()}
              disabled={!editor.can().chain().focus().setParagraph().run()}
            >
              <Pilcrow className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Paragraph</TooltipContent>
        </Tooltip>
        <Separator orientation="vertical" className="h-6 mx-1" />

        <Tooltip>
          <TooltipTrigger asChild>
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
              disabled={!editor.can().insertTable()}
            >
              <TableIcon className="h-4 w-4" />
              <span className="sr-only">Insert Table</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Insert Table</TooltipContent>
        </Tooltip>

        {isTableContext && (
          <Separator orientation="vertical" className="h-6 mx-1" />
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().addRowBefore().run()}
              disabled={!editor.can().addRowBefore()}
              className={!isTableContext ? "hidden" : ""}
            >
              <ArrowUpSquare className="h-4 w-4" />
              <span className="sr-only">Add Row Before</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Add Row Before</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().addRowAfter().run()}
              disabled={!editor.can().addRowAfter()}
              className={!isTableContext ? "hidden" : ""}
            >
              <ArrowDownSquare className="h-4 w-4" />
              <span className="sr-only">Add Row After</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Add Row After</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().deleteRow().run()}
              disabled={!editor.can().deleteRow()}
              className={cn(
                "text-destructive hover:bg-destructive/10",
                !isTableContext ? "hidden" : ""
              )}
            >
              <Rows3 className="h-4 w-4" />
              <Minus className="absolute h-2 w-2" />
              <span className="sr-only">Delete Row</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Delete Row</TooltipContent>
        </Tooltip>

        {isTableContext && (
          <Separator orientation="vertical" className="h-6 mx-1" />
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().addColumnBefore().run()}
              disabled={!editor.can().addColumnBefore()}
              className={!isTableContext ? "hidden" : ""}
            >
              <ArrowLeftSquare className="h-4 w-4" />
              <span className="sr-only">Add Column Before</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Add Column Before</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().addColumnAfter().run()}
              disabled={!editor.can().addColumnAfter()}
              className={!isTableContext ? "hidden" : ""}
            >
              <ArrowRightSquare className="h-4 w-4" />
              <span className="sr-only">Add Column After</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Add Column After</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().deleteColumn().run()}
              disabled={!editor.can().deleteColumn()}
              className={cn(
                "text-destructive hover:bg-destructive/10",
                !isTableContext ? "hidden" : ""
              )}
            >
              <Columns3 className="h-4 w-4" />
              <Minus className="absolute h-2 w-2" />
              <span className="sr-only">Delete Column</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Delete Column</TooltipContent>
        </Tooltip>

        {isTableContext && (
          <Separator orientation="vertical" className="h-6 mx-1" />
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().mergeOrSplit().run()}
              disabled={!editor.can().mergeOrSplit()}
              className={!isTableContext ? "hidden" : ""}
            >
              {editor.can().mergeCells() ? (
                <Combine className="h-4 w-4" />
              ) : (
                <Split className="h-4 w-4" />
              )}
              <span className="sr-only">Merge/Split Cells</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Merge/Split Cells</TooltipContent>
        </Tooltip>

        {isTableContext && (
          <Separator orientation="vertical" className="h-6 mx-1" />
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleHeaderRow().run()}
              disabled={!editor.can().toggleHeaderRow()}
              className={!isTableContext ? "hidden" : ""}
            >
              <FlipVertical className="h-4 w-4" />
              <span className="sr-only">Toggle Header Row</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Toggle Header Row</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleHeaderColumn().run()}
              disabled={!editor.can().toggleHeaderColumn()}
              className={!isTableContext ? "hidden" : ""}
            >
              <FlipHorizontal className="h-4 w-4" />
              <span className="sr-only">Toggle Header Column</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Toggle Header Column</TooltipContent>
        </Tooltip>

        {isTableContext && (
          <Separator orientation="vertical" className="h-6 mx-1" />
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().deleteTable().run()}
              disabled={!editor.can().deleteTable()}
              className={cn(
                "text-destructive hover:bg-destructive/10",
                !isTableContext ? "hidden" : ""
              )}
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete Table</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Delete Table</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
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
