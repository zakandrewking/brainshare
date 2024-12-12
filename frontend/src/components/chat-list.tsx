import { Separator } from "@/components/ui/separator";
import { UIState } from "@/utils/chat/actions";

export interface ChatList {
  messages: UIState;
}

export function ChatList({ messages }: ChatList) {
  if (!messages.length) {
    return null;
  }

  return (
    <div className="relative mx-auto max-w-2xl px-4 pt-6 pb-[150px]">
      {messages.map((message, index) => (
        <div key={message.id}>
          {message.display}
          {index < messages.length - 1 && <Separator className="my-4" />}
        </div>
      ))}
    </div>
  );
}
