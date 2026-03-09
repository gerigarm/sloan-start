import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MessageSquare, Send, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { streamChat, trackChatEvent } from "@/lib/chat-stream";
import ReactMarkdown from "react-markdown";

const QUICK_PROMPTS = [
  "What should I focus on this week?",
  "Any upcoming deadlines?",
  "Who can help with housing?",
];

export function DashboardChatWidget() {
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [asked, setAsked] = useState(false);

  const handleAsk = useCallback(async (question: string) => {
    setLoading(true);
    setAsked(true);
    setAnswer("");
    trackChatEvent("chatbot_opened", { source: "dashboard_widget" });

    let result = "";
    await streamChat({
      messages: [{ role: "user", content: question }],
      onDelta: (chunk) => {
        result += chunk;
        setAnswer(result);
      },
      onDone: () => setLoading(false),
      onError: (err) => {
        setAnswer(`Error: ${err}`);
        setLoading(false);
      },
    });
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;
    handleAsk(input.trim());
    setInput("");
  };

  return (
    <Card className="shadow-[var(--shadow-card)]">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="font-sans text-sm flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5 text-primary" />
            Ask 6W
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground h-7 px-2"
            onClick={() => navigate("/chat")}
          >
            Full chat <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-2.5">
        {!asked ? (
          <>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => handleAsk(p)}
                  disabled={loading}
                  className="text-[11px] px-2.5 py-1 rounded-full border border-border bg-muted/50
                    text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
            <form onSubmit={handleSubmit} className="flex gap-1.5">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Quick question..."
                className="text-xs h-8"
                disabled={loading}
              />
              <Button type="submit" size="icon" className="h-8 w-8 shrink-0" disabled={loading || !input.trim()}>
                <Send className="h-3.5 w-3.5" />
              </Button>
            </form>
          </>
        ) : (
          <div className="space-y-2">
            <div className="text-xs max-h-32 overflow-y-auto prose prose-sm prose-p:my-1 text-foreground">
              <ReactMarkdown>{answer || "Thinking..."}</ReactMarkdown>
            </div>
            {!loading && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => { setAsked(false); setAnswer(""); }}
                >
                  Ask another
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => navigate("/chat")}
                >
                  Continue in chat →
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
