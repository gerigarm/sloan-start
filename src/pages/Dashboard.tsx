import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarClock, ExternalLink, Flag, Pause, MessageCircle, Loader2 } from "lucide-react";
import JourneyGraph from "@/components/JourneyGraph";
import { DashboardChatWidget } from "@/components/chat/DashboardChatWidget";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { differenceInWeeks } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";

type KnowledgeSource = Tables<"knowledge_sources">;

const useCurrentWeek = () => {
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("created_at")
        .eq("user_id", user!.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  if (!profile) return 0;
  const weeks = differenceInWeeks(new Date(), new Date(profile.created_at));
  return Math.min(Math.max(weeks, 0), 5); // 0-indexed, 6-week program
};

const useKnowledgeSources = () => {
  return useQuery({
    queryKey: ["knowledge_sources"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("knowledge_sources")
        .select("*")
        .eq("is_active", true);
      if (error) throw error;
      return data as KnowledgeSource[];
    },
  });
};

const PanelList = ({ items, emptyText }: { items: KnowledgeSource[]; emptyText: string }) => {
  if (!items.length) {
    return (
      <p className="text-xs text-muted-foreground italic">{emptyText}</p>
    );
  }
  return (
    <ul className="space-y-1.5">
      {items.slice(0, 4).map((item) => (
        <li key={item.id} className="text-xs text-foreground flex items-start gap-1.5">
          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
          <span>
            {item.url ? (
              <a href={item.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-primary transition-colors">
                {item.title}
              </a>
            ) : (
              item.title
            )}
          </span>
        </li>
      ))}
      {items.length > 4 && (
        <li className="text-xs text-muted-foreground">+{items.length - 4} more</li>
      )}
    </ul>
  );
};

const Dashboard = () => {
  const currentWeek = useCurrentWeek();
  const { data: sources, isLoading } = useKnowledgeSources();

  // Filter by current week or no week (always relevant)
  const relevant = (sources ?? []).filter(
    (s) => s.week_relevant === null || s.week_relevant === currentWeek
  );

  const priorities = relevant.filter((s) => s.content_type === "milestone");
  const deferred = (sources ?? []).filter(
    (s) => s.content_type === "milestone" && s.week_relevant !== null && s.week_relevant > currentWeek
  );
  const deadlines = relevant.filter((s) => s.content_type === "deadline");
  const linksContacts = relevant.filter((s) =>
    ["link", "contact", "resource"].includes(s.content_type)
  );
  const weeklyNote = relevant.find((s) => s.content_type === "weekly_guidance");

  const LoadingPlaceholder = () => (
    <div className="flex items-center justify-center py-3">
      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
    </div>
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-3xl text-foreground">Your Week</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Week {currentWeek + 1} of 6 — Personalized priorities and deadlines
        </p>
      </div>

      <JourneyGraph />

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="font-sans text-sm flex items-center gap-1.5">
              <Flag className="h-3.5 w-3.5 text-primary" />
              What Matters Now
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {isLoading ? <LoadingPlaceholder /> : (
              <PanelList items={priorities} emptyText="No priorities this week" />
            )}
          </CardContent>
        </Card>

        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="font-sans text-sm flex items-center gap-1.5">
              <Pause className="h-3.5 w-3.5 text-muted-foreground" />
              What Can Wait
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {isLoading ? <LoadingPlaceholder /> : (
              <PanelList items={deferred} emptyText="Nothing deferred" />
            )}
          </CardContent>
        </Card>

        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="font-sans text-sm flex items-center gap-1.5">
              <CalendarClock className="h-3.5 w-3.5 text-destructive" />
              Key Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {isLoading ? <LoadingPlaceholder /> : (
              <PanelList items={deadlines} emptyText="No deadlines this week" />
            )}
          </CardContent>
        </Card>

        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="font-sans text-sm flex items-center gap-1.5">
              <ExternalLink className="h-3.5 w-3.5 text-info" />
              Links & Contacts
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {isLoading ? <LoadingPlaceholder /> : (
              <PanelList items={linksContacts} emptyText="No links yet" />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <DashboardChatWidget />

        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="font-sans text-sm flex items-center gap-1.5">
              <MessageCircle className="h-3.5 w-3.5 text-success" />
              This Week's Note
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {isLoading ? <LoadingPlaceholder /> : weeklyNote ? (
              <p className="text-xs text-foreground leading-relaxed">{weeklyNote.content}</p>
            ) : (
              <p className="text-xs text-muted-foreground italic">No note for this week</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
