import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";
import type { Nudge } from "@/lib/personalization";
import { trackPersonalizationEvent } from "@/hooks/usePersonalization";

const iconMap: Record<string, string> = {
  focus: "🎯",
  defer: "⏸️",
  deadline: "📅",
  support: "💙",
};

const NudgeItem = ({ nudge }: { nudge: Nudge }) => {
  const handleClick = () => {
    trackPersonalizationEvent("nudge_clicked", {
      nudge_type: nudge.type,
      source_id: nudge.sourceId,
    });
  };

  return (
    <div
      className="flex items-start gap-2 cursor-default"
      onClick={handleClick}
    >
      <span className="text-sm mt-0.5">{iconMap[nudge.type] ?? "💡"}</span>
      <div>
        <p className="text-xs font-medium text-foreground">{nudge.title}</p>
        <p className="text-[11px] text-muted-foreground">
          {nudge.url ? (
            <a
              href={nudge.url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-primary transition-colors"
            >
              {nudge.description}
            </a>
          ) : (
            nudge.description
          )}
        </p>
      </div>
    </div>
  );
};

export function NudgeCard({ nudges }: { nudges: Nudge[] }) {
  if (nudges.length === 0) return null;

  return (
    <Card className="shadow-[var(--shadow-card)] border-primary/20 bg-primary/[0.02]">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="font-sans text-sm flex items-center gap-1.5">
          <Lightbulb className="h-3.5 w-3.5 text-primary" />
          Personalized Guidance
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        {nudges.map((n, i) => (
          <NudgeItem key={i} nudge={n} />
        ))}
      </CardContent>
    </Card>
  );
}
