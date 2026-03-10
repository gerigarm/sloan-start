import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CalendarClock, ExternalLink, Flag, MessageCircle, Loader2, Plus, Check, X } from "lucide-react";
import JourneyGraph from "@/components/JourneyGraph";
import EnergyBar from "@/components/EnergyBar";
import { DashboardChatWidget } from "@/components/chat/DashboardChatWidget";
import { NudgeCard } from "@/components/dashboard/NudgeCard";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePersonalization, trackPersonalizationEvent } from "@/hooks/usePersonalization";
import { getPersonalizedItems, generateNudges, isHighStress } from "@/lib/personalization";
import type { Tables } from "@/integrations/supabase/types";

type KnowledgeSource = Tables<"knowledge_sources">;

interface UserNote {
  id: string;
  user_id: string;
  title: string;
  category: string;
  is_completed: boolean;
  created_at: string;
}

const useKnowledgeSources = () =>
  useQuery({
    queryKey: ["knowledge_sources"],
    queryFn: async () => {
      const { data, error } = await supabase.from("knowledge_sources").select("*").eq("is_active", true);
      if (error) throw error;
      return data as KnowledgeSource[];
    },
  });

const useUserNotes = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["user_notes", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("user_notes").select("*").eq("user_id", user!.id).order("created_at", { ascending: true });
      if (error) throw error;
      return data as UserNote[];
    },
    enabled: !!user,
  });
};

const AddNoteInline = ({ category, onAdd }: { category: string; onAdd: (title: string, category: string) => void }) => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors mt-1"
      >
        <Plus className="h-3 w-3" /> Add note
      </button>
    );
  }

  const submit = () => {
    if (value.trim()) {
      onAdd(value.trim(), category);
      setValue("");
      setOpen(false);
    }
  };

  return (
    <div className="flex items-center gap-1 mt-1">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="Add a note…"
        className="h-7 text-xs"
        autoFocus
      />
      <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={submit}>
        <Check className="h-3 w-3" />
      </Button>
      <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => { setOpen(false); setValue(""); }}>
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
};

const NoteItem = ({ note, onToggle }: { note: UserNote; onToggle: (id: string, completed: boolean) => void }) => (
  <li className="text-xs text-foreground flex items-start gap-1.5 group">
    <button onClick={() => onToggle(note.id, !note.is_completed)} className="mt-0.5 shrink-0">
      <span className={`block h-3 w-3 rounded border ${note.is_completed ? "bg-primary border-primary" : "border-muted-foreground"} flex items-center justify-center`}>
        {note.is_completed && <Check className="h-2 w-2 text-primary-foreground" />}
      </span>
    </button>
    <span className={note.is_completed ? "line-through text-muted-foreground" : ""}>{note.title}</span>
  </li>
);

const PanelList = ({ items, emptyText }: { items: KnowledgeSource[]; emptyText: string }) => {
  if (!items.length) return <p className="text-xs text-muted-foreground italic">{emptyText}</p>;
  return (
    <ul className="space-y-1.5">
      {items.slice(0, 4).map((item) => (
        <li key={item.id} className="text-xs text-foreground flex items-start gap-1.5">
          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
          <span>
            {item.url ? (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-primary transition-colors"
                onClick={() => trackPersonalizationEvent("resource_clicked", { source_id: item.id, title: item.title })}
              >
                {item.title}
              </a>
            ) : item.title}
          </span>
        </li>
      ))}
      {items.length > 4 && <li className="text-xs text-muted-foreground">+{items.length - 4} more</li>}
    </ul>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const { ctx } = usePersonalization();
  const { data: sources, isLoading } = useKnowledgeSources();
  const { data: userNotes } = useUserNotes();
  const queryClient = useQueryClient();

  const addNote = useMutation({
    mutationFn: async ({ title, category }: { title: string; category: string }) => {
      const { error } = await (supabase as any).from("user_notes").insert({ user_id: user!.id, title, category });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["user_notes"] }),
  });

  const toggleNote = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { error } = await (supabase as any).from("user_notes").update({ is_completed: completed }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["user_notes"] }),
  });

  // ─── Personalized content ─────────────────────────────────────
  const allSources = sources ?? [];
  const priorities = getPersonalizedItems(allSources, "milestone", ctx, 6)
    .filter(s => s.week_relevant === null || s.week_relevant === ctx.currentWeek);
  const deadlines = getPersonalizedItems(allSources, "deadline", ctx, 6);
  const linksContacts = getPersonalizedItems(allSources, ["link", "contact", "resource"], ctx, 6);
  const nudges = generateNudges(allSources, ctx);
  const weeklyNote = allSources.find((s) => s.content_type === "weekly_guidance" && (s.week_relevant === null || s.week_relevant === ctx.currentWeek));
  const stressMode = isHighStress(ctx.wellbeing);

  // Dummy deadlines when none from DB
  const dummyDeadlines = [
    { title: "Health Insurance Enrollment", date: "Mar 14" },
    { title: "Financial aid documents due", date: "Mar 18" },
    { title: "International Students – ISSO Check-in", date: "Mar 21" },
    { title: "Course registration deadline", date: "Mar 28" },
  ];

  const priorityNotes = (userNotes ?? []).filter((n) => n.category === "priority");
  const deferredNotes = (userNotes ?? []).filter((n) => n.category === "deferred");

  const Loading = () => (
    <div className="flex items-center justify-center py-3">
      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
    </div>
  );

  const handleAdd = (title: string, category: string) => addNote.mutate({ title, category });
  const handleToggle = (id: string, completed: boolean) => toggleNote.mutate({ id, completed });

  return (
    <div className="space-y-5">
      <JourneyGraph />

      <EnergyBar />

      <div>
        <h1 className="font-serif text-3xl text-foreground">Your Week</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Week {ctx.currentWeek + 1} of 6 — {stressMode ? "Simplified view — focus on what matters most" : "Personalized priorities and deadlines"}
        </p>
      </div>

      {/* Personalized nudges */}
      {nudges.length > 0 && <NudgeCard nudges={nudges} />}

      <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="font-sans text-sm flex items-center gap-1.5">
              <Flag className="h-3.5 w-3.5 text-primary" />
              What Matters Now
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            {isLoading ? <Loading /> : <PanelList items={priorities} emptyText="No priorities this week" />}
            {priorityNotes.length > 0 && (
              <ul className="space-y-1.5 border-t border-border pt-2">
                {priorityNotes.map((n) => <NoteItem key={n.id} note={n} onToggle={handleToggle} />)}
              </ul>
            )}
            <AddNoteInline category="priority" onAdd={handleAdd} />
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
            {isLoading ? <Loading /> : (
              <ul className="space-y-1.5">
                {(deadlines.length > 0 ? deadlines.slice(0, 4).map((item, i) => ({
                  title: item.title,
                  date: item.metadata && typeof item.metadata === "object" && "date" in item.metadata
                    ? String((item.metadata as Record<string, unknown>).date)
                    : dummyDeadlines[i]?.date ?? "",
                })) : dummyDeadlines).map((d) => (
                  <li key={d.title} className="text-xs text-foreground flex items-start justify-between gap-2">
                    <div className="flex items-start gap-1.5">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      <span>{d.title}</span>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">{d.date}</span>
                  </li>
                ))}
              </ul>
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
            {isLoading ? <Loading /> : <PanelList items={linksContacts} emptyText="No links yet" />}
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
            {isLoading ? (
              <div className="flex items-center justify-center py-3">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : weeklyNote ? (
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
