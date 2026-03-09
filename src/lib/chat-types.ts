export interface ChatMessage {
  id?: string;
  role: "user" | "assistant";
  content: string;
  sources?: SourceRef[];
  isFallback?: boolean;
  createdAt?: string;
}

export interface SourceRef {
  id?: string;
  title: string;
  content_type: string;
  url?: string | null;
  updated_at?: string;
}

export const SUGGESTED_PROMPTS = [
  "What do I need to focus on this week?",
  "What deadlines are coming up?",
  "Where can I find the relevant policy?",
  "Who should I contact about housing?",
  "What can wait until later?",
];
