import { ExternalLink, FileText, Users, Calendar, BookOpen, HelpCircle, Flag, Link2 } from "lucide-react";
import type { SourceRef } from "@/lib/chat-types";

const typeIcons: Record<string, typeof FileText> = {
  policy: FileText,
  faq: HelpCircle,
  deadline: Calendar,
  contact: Users,
  milestone: Flag,
  link: Link2,
  resource: BookOpen,
  weekly_guidance: BookOpen,
};

const typeLabels: Record<string, string> = {
  policy: "Policy",
  faq: "FAQ",
  deadline: "Deadline",
  contact: "Contact",
  milestone: "Milestone",
  link: "Link",
  resource: "Resource",
  weekly_guidance: "Weekly Guidance",
};

export function SourceCard({ source }: { source: SourceRef }) {
  const Icon = typeIcons[source.content_type] || FileText;
  const label = typeLabels[source.content_type] || source.content_type;

  return (
    <a
      href={source.url || undefined}
      target={source.url ? "_blank" : undefined}
      rel="noopener noreferrer"
      className={`flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs transition-colors ${
        source.url ? "hover:bg-accent cursor-pointer" : "cursor-default"
      }`}
    >
      <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground truncate">{source.title}</p>
        <p className="text-muted-foreground">{label}</p>
      </div>
      {source.url && <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />}
    </a>
  );
}

export function SourceList({ sources }: { sources: SourceRef[] }) {
  if (!sources.length) return null;

  return (
    <div className="mt-2 space-y-1.5">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Sources</p>
      <div className="grid gap-1.5 sm:grid-cols-2">
        {sources.map((s, i) => (
          <SourceCard key={s.id || i} source={s} />
        ))}
      </div>
    </div>
  );
}
