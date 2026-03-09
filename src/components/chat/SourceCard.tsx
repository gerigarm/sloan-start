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
      className={`flex items-center gap-1.5 rounded border border-border bg-muted/40 px-2 py-1 text-[10px] transition-colors ${
        source.url ? "hover:bg-accent cursor-pointer" : "cursor-default"
      }`}
    >
      <Icon className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
      <span className="text-muted-foreground truncate">{source.title}</span>
      <span className="text-muted-foreground/60 shrink-0">· {label}</span>
      {source.url && <ExternalLink className="h-2 w-2 text-muted-foreground/50 shrink-0" />}
    </a>
  );
}

export function SourceList({ sources }: { sources: SourceRef[] }) {
  if (!sources.length) return null;

  return (
    <div className="mt-2 space-y-1">
      <p className="text-[7px] uppercase tracking-widest text-muted-foreground/60 font-medium">Sources</p>
      <div className="grid gap-1.5 sm:grid-cols-2">
        {sources.map((s, i) => (
          <SourceCard key={s.id || i} source={s} />
        ))}
      </div>
    </div>
  );
}
