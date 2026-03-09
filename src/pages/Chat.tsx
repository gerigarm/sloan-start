import { useState, useCallback, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { ChatMessageList } from "@/components/chat/ChatMessageList";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatEmptyState } from "@/components/chat/ChatEmptyState";
import { streamChat, trackChatEvent } from "@/lib/chat-stream";
import type { ChatMessage } from "@/lib/chat-types";

const Chat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    trackChatEvent("chatbot_opened");
  }, []);

  const handleSend = useCallback(
    async (input: string) => {
      const userMsg: ChatMessage = { role: "user", content: input };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);
      setError(null);

      if (messages.length === 0) {
        trackChatEvent("first_message_sent", { message: input });
      }

      let assistantSoFar = "";
      const allMessages = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      try {
        await streamChat({
          messages: allMessages,
          onDelta: (chunk) => {
            assistantSoFar += chunk;
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant") {
                return prev.map((m, i) =>
                  i === prev.length - 1 ? { ...m, content: assistantSoFar } : m
                );
              }
              return [...prev, { role: "assistant", content: assistantSoFar }];
            });
          },
          onDone: () => {
            setIsLoading(false);
            // Check if it's a fallback
            const lower = assistantSoFar.toLowerCase();
            if (
              lower.includes("i don't have a verified answer") ||
              lower.includes("i'm not fully certain")
            ) {
              trackChatEvent("fallback_triggered", { question: input });
              setMessages((prev) =>
                prev.map((m, i) =>
                  i === prev.length - 1 ? { ...m, isFallback: true } : m
                )
              );
            }
          },
          onError: (err) => {
            setIsLoading(false);
            setError(err);
            trackChatEvent("error", { error: err });
          },
        });
      } catch (e) {
        setIsLoading(false);
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    },
    [messages]
  );

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-[calc(100vh-5.5rem)]">
      <div className="mb-3">
        <h1 className="font-serif text-3xl text-foreground">Ask 6W</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Get answers grounded in real Sloan information
        </p>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden shadow-[var(--shadow-card)]">
        {isEmpty && !isLoading ? (
          <ChatEmptyState />
        ) : (
          <ChatMessageList messages={messages} isLoading={isLoading} />
        )}

        {error && (
          <div className="px-4 py-2 bg-destructive/10 text-destructive text-xs text-center">
            {error}
          </div>
        )}

        <ChatInput
          onSend={handleSend}
          disabled={isLoading}
          showSuggestions={isEmpty}
        />
      </Card>
    </div>
  );
};

export default Chat;
