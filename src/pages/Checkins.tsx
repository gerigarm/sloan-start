import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Heart, TrendingUp, Clock, Check } from "lucide-react";
import { motion } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";

interface Checkin {
  id: string;
  energy_level: number;
  created_at: string;
}

const ENERGY_LABELS: Record<number, { label: string; emoji: string; color: string }> = {
  1: { label: "Running on empty", emoji: "😔", color: "text-destructive" },
  2: { label: "Pretty low", emoji: "😕", color: "text-destructive" },
  3: { label: "Below average", emoji: "😐", color: "text-warning" },
  4: { label: "Hanging in there", emoji: "🙂", color: "text-warning" },
  5: { label: "Doing okay", emoji: "😊", color: "text-muted-foreground" },
  6: { label: "Pretty good", emoji: "😄", color: "text-success" },
  7: { label: "Feeling strong", emoji: "💪", color: "text-success" },
  8: { label: "Great energy", emoji: "🔥", color: "text-primary" },
  9: { label: "On top of the world", emoji: "🌟", color: "text-primary" },
  10: { label: "Unstoppable", emoji: "🚀", color: "text-primary" },
};

const Checkins = () => {
  const [energy, setEnergy] = useState(5);
  const [submitted, setSubmitted] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: history } = useQuery({
    queryKey: ["checkins", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wellbeing_checkins")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as Checkin[];
    },
    enabled: !!user,
  });

  const submit = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("wellbeing_checkins").insert({
        user_id: user!.id,
        energy_level: energy * 10,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checkins"] });
      queryClient.invalidateQueries({ queryKey: ["wellbeing"] });
      setSubmitted(true);
      toast({ title: "Check-in saved ✓" });
      setTimeout(() => setSubmitted(false), 3000);
    },
  });

  const info = ENERGY_LABELS[energy];
  const latest = history?.[0];
  const avg = history?.length
    ? Math.round(history.reduce((s, c) => s + c.energy_level, 0) / history.length)
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-foreground">Check-ins</h1>
        <p className="text-muted-foreground mt-1">Quick wellbeing snapshots to track your energy over time</p>
      </div>

      {/* Check-in form */}
      <Card className="shadow-[var(--shadow-card)]">
        <CardHeader className="pb-3">
          <CardTitle className="font-sans text-base flex items-center gap-2">
            <Heart className="h-4 w-4 text-primary" />
            How are you feeling right now?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-1">
            <motion.span
              key={energy}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="text-4xl block"
            >
              {info.emoji}
            </motion.span>
            <p className={`text-sm font-medium ${info.color}`}>{info.label}</p>
            <p className="text-xs text-muted-foreground">{energy} / 10</p>
          </div>

          <div className="px-2">
            <Slider
              value={[energy]}
              onValueChange={([v]) => setEnergy(v)}
              min={1}
              max={10}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>

          <Button
            onClick={() => submit.mutate()}
            disabled={submit.isPending || submitted}
            className="w-full gap-2"
          >
            {submitted ? (
              <><Check className="h-4 w-4" /> Saved!</>
            ) : submit.isPending ? (
              "Saving…"
            ) : (
              "Log check-in"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="shadow-[var(--shadow-card)]">
          <CardContent className="p-4 flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Average energy</p>
              <p className="text-lg font-semibold text-foreground">{avg !== null ? `${avg}%` : "—"}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-[var(--shadow-card)]">
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="h-5 w-5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Last check-in</p>
              <p className="text-sm font-medium text-foreground">
                {latest ? formatDistanceToNow(new Date(latest.created_at), { addSuffix: true }) : "Never"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* History */}
      {history && history.length > 0 && (
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader className="pb-2">
            <CardTitle className="font-sans text-sm">Recent check-ins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {history.map((c) => {
                const level = Math.round(c.energy_level / 10);
                const eInfo = ENERGY_LABELS[Math.min(Math.max(level, 1), 10)];
                return (
                  <div key={c.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{eInfo.emoji}</span>
                      <div>
                        <p className="text-xs font-medium text-foreground">{eInfo.label}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {format(new Date(c.created_at), "MMM d, h:mm a")}
                        </p>
                      </div>
                    </div>
                    <span className={`text-sm font-semibold ${eInfo.color}`}>{c.energy_level}%</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Checkins;
