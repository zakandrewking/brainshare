"use client";

// import { useAIState, useUIState } from 'ai/rsc';
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";

// import { toast } from "sonner";
// import { ChatList } from '@/components/chat-list';
import { ChatPanel } from "@/components/chat-panel";
import { EmptyScreen } from "@/components/empty-screen";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
// import { useLocalStorage } from '@/lib/hooks/use-local-storage';
import { useScrollAnchor } from "@/hooks/use-scroll-anchor";
// import { Message, Session } from '@/lib/types';
import { cn } from "@/lib/utils";

import { Stack } from "./ui/stack";

export interface ChatProps extends React.ComponentProps<"div"> {
  // initialMessages?: Message[]
  // id?: string;
  // session?: Session
  // missingKeys: string[];
}

export function Chat({ className }: ChatProps) {
  const router = useRouter();
  const path = usePathname();
  const [input, setInput] = React.useState("");
  // const [messages] = useUIState()
  const [messages, setMessages] = React.useState([]);
  // const [aiState] = useAIState()
  const [model, setModel] = React.useState("gpt-3.5-turbo");

  // const [_, setNewChatId] = useLocalStorage('newChatId', id)

  const handleModelChange = (value: string) => {
    setModel(value);
  };

  // useEffect(() => {
  //   if (session?.user) {
  //     if (!path.includes("chat") && messages.length === 1) {
  //       window.history.replaceState({}, "", `/chat/${id}`);
  //     }
  //   }
  // }, [id, path, session?.user, messages]);

  // useEffect(() => {
  //   const messagesLength = aiState.messages?.length;
  //   if (messagesLength === 2) {
  //     router.refresh();
  //   }
  // }, [aiState.messages, router]);

  // useEffect(() => {
  //   setNewChatId(id);
  // });

  // useEffect(() => {
  //   missingKeys.map((key) => {
  //     toast.error(`Missing ${key} environment variable!`);
  //   });
  // }, [missingKeys]);

  const { messagesRef, scrollRef, visibilityRef, isAtBottom, scrollToBottom } =
    useScrollAnchor();

  return (
    <div ref={scrollRef} className="w-full max-w-[630px]">
      <Stack direction="col" alignItems="start" className="w-full">
        <Select value={model} onValueChange={handleModelChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select a model" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
            <SelectItem value="claude-3-5-sonnet">Claude 3.5 Sonnet</SelectItem>
          </SelectContent>
        </Select>

        <div className={cn("mx-auto", className)} ref={messagesRef}>
          {messages.length ? (
            <></>
          ) : (
            // <ChatList messages={messages} isShared={false} session={session} />
            <EmptyScreen />
          )}
          <div className="w-full h-px" ref={visibilityRef} />
        </div>
      </Stack>

      <ChatPanel
        // id={id}
        // input={input}
        // setInput={setInput}
        isAtBottom={isAtBottom}
        scrollToBottom={scrollToBottom}
        // model={model}
      />
    </div>
  );
}
