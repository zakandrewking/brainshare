"use client";

import { useActions, useAIState, useUIState } from "ai/rsc";
import * as React from "react";

import { nanoid } from "@/lib/utils";

import { ButtonScrollToBottom } from "./button-scroll-to-bottom";
import { FooterText } from "./footer";
import { UserMessage } from "./message";
import { PromptForm } from "./prompt-form";
import { Button } from "./ui/button";
import { IconShare } from "./ui/icons";

// import { shareChat } from "@/app/actions";
// import { ButtonScrollToBottom } from "@/components/button-scroll-to-bottom";
// import { ChatShareDialog } from "@/components/chat-share-dialog";
// import { FooterText } from "@/components/footer";
// import { PromptForm } from "@/components/prompt-form";
// import { Button } from "@/components/ui/button";
// import { IconShare } from "@/components/ui/icons";

// import { UserMessage } from "./stocks/message";

import type { AI } from "@/lib/chat/actions";
export interface ChatPanelProps {
  id?: string;
  title?: string;
  input: string;
  setInput: (value: string) => void;
  isAtBottom: boolean;
  scrollToBottom: () => void;
  model: string;
}

export function ChatPanel({
  id,
  title,
  input,
  setInput,
  isAtBottom,
  scrollToBottom,
  model,
}: ChatPanelProps) {
  const [aiState] = useAIState();
  const [messages, setMessages] = useUIState<typeof AI>();
  const { submitUserMessage } = useActions<typeof AI>();
  const [shareDialogOpen, setShareDialogOpen] = React.useState(false);

  const exampleMessages = [
    {
      heading: "Teach me about",
      subheading: "predator prey dynamics",
      message: `Teach me about predator prey dynamics`,
    },
    {
      heading: "Make me a slide deck about",
      subheading: "the history of coffee",
      message: "Make me a slide deck about the history of coffee",
    },
    {
      heading: "Create an audo book about",
      subheading: "the culture of Ancient Egypt",
      message: "Create an audio book about the culture of Ancient Egypt",
    },
    {
      heading: "Walk me through",
      subheading: "the process of photosynthesis",
      message: "Walk me through the process of photosynthesis",
    },
  ];

  return (
    <div className="fixed inset-x-0 bottom-0 w-full from-muted/30 from-0% to-muted/30 to-50% duration-300 ease-in-out animate-in dark:from-background/10 dark:from-10% dark:to-background/80 peer-[[data-state=open]]:group-[]:lg:pl-[250px] peer-[[data-state=open]]:group-[]:xl:pl-[300px]">
      <ButtonScrollToBottom
        isAtBottom={isAtBottom}
        scrollToBottom={scrollToBottom}
      />

      <div className="mx-auto sm:max-w-2xl sm:px-4">
        <div className="mb-4 grid grid-cols-2 gap-2 px-4 sm:px-0">
          {messages.length === 0 &&
            exampleMessages.map((example, index) => (
              <div
                key={example.heading}
                className={`cursor-pointer rounded-lg border bg-white p-4 hover:bg-zinc-50 dark:bg-zinc-950 dark:hover:bg-zinc-900 ${
                  index > 1 && "hidden md:block"
                }`}
                onClick={async () => {
                  setMessages((currentMessages) => [
                    ...currentMessages,
                    {
                      id: nanoid(),
                      display: <UserMessage>{example.message}</UserMessage>,
                    },
                  ]);
                  const responseMessage = await submitUserMessage(
                    example.message,
                    model
                  );
                  setMessages((currentMessages) => [
                    ...currentMessages,
                    responseMessage,
                  ]);
                }}
              >
                <div className="text-sm font-semibold">{example.heading}</div>
                <div className="text-sm text-zinc-600 dark:text-zinc-500">
                  {example.subheading}
                </div>
              </div>
            ))}
        </div>

        {messages?.length >= 2 ? (
          <div className="flex h-12 items-center justify-center">
            <div className="flex space-x-2">
              {id && title ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setShareDialogOpen(true)}
                  >
                    <IconShare className="mr-2" />
                    Share
                  </Button>
                  {/* <ChatShareDialog
                    open={shareDialogOpen}
                    onOpenChange={setShareDialogOpen}
                    onCopy={() => setShareDialogOpen(false)}
                    shareChat={shareChat}
                    chat={{
                      id,
                      title,
                      messages: aiState.messages,
                    }} */}
                  {/* /> */}
                </>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="space-y-4 border-t bg-background px-4 py-2 shadow-lg sm:rounded-t-xl sm:border md:py-4">
          <PromptForm input={input} setInput={setInput} model={model} />
          <FooterText className="hidden sm:block" />
        </div>
      </div>
    </div>
  );
}
