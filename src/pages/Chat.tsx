import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

const Chat = () => {
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="mb-4">
        <h1 className="font-serif text-3xl text-foreground">Ask 6W</h1>
        <p className="text-muted-foreground mt-1">Get answers grounded in real Sloan information</p>
      </div>

      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="font-sans text-base">AI Assistant</CardTitle>
          <CardDescription>Every answer cites its source. If unsure, I'll say so.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center text-sm text-muted-foreground">
            <p>Chatbot will be built in Step 6.</p>
            <p className="mt-1">It will use retrieval-augmented generation with stored Sloan content.</p>
          </div>
        </CardContent>
        <div className="p-4 border-t flex gap-2">
          <Input placeholder="Ask about deadlines, policies, contacts..." disabled />
          <Button size="icon" disabled>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Chat;
