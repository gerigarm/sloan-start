import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { TrendingUp, Award, Heart, Activity } from "lucide-react";

interface CheckinData {
  energy_level: number;
  created_at: string;
}

const milestones = [
  { week: 0, label: "First check-in" },
  { week: 1, label: "One week in" },
  { week: 2, label: "Finding your pace" },
  { week: 3, label: "Halfway there" },
  { week: 4, label: "Building momentum" },
  { week: 5, label: "Almost there" },
  { week: 6, label: "Fully onboarded" },
];

const encouragements = [
  "You're showing up for yourself — that's what matters.",
  "Consistency builds resilience. You're doing it.",
  "Highs and lows are both part of the journey.",
  "Every check-in is a data point toward self-awareness.",
  "You're further along than you think.",
];

const Wellbeing = () => {
  const { user } = useAuth();
  const [checkins, setCheckins] = useState<CheckinData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("wellbeing_checkins")
      .select("energy_level, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        setCheckins(data ?? []);
        setLoading(false);
      });
  }, [user]);

  const totalCheckins = checkins.length;
  const avgEnergy = totalCheckins
    ? Math.round(checkins.reduce((s, c) => s + c.energy_level, 0) / totalCheckins)
    : 0;
  const currentStreak = (() => {
    let streak = 0;
    const today = new Date();
    for (let i = checkins.length - 1; i >= 0; i--) {
      const d = new Date(checkins[i].created_at);
      const diff = Math.floor((today.getTime() - d.getTime()) / 86400000);
      if (diff <= streak + 1) streak++;
      else break;
    }
    return streak;
  })();

  // Determine reached milestones based on days since first checkin
  const daysSinceStart = totalCheckins
    ? Math.floor((Date.now() - new Date(checkins[0].created_at).getTime()) / 86400000)
    : 0;
  const weeksIn = Math.min(Math.floor(daysSinceStart / 7), 6);

  // Group checkins by day for the graph
  const dailyData = checkins.reduce<{ date: string; avg: number; count: number }[]>((acc, c) => {
    const date = c.created_at.slice(0, 10);
    const existing = acc.find((d) => d.date === date);
    if (existing) {
      existing.avg = (existing.avg * existing.count + c.energy_level) / (existing.count + 1);
      existing.count++;
    } else {
      acc.push({ date, avg: c.energy_level, count: 1 });
    }
    return acc;
  }, []);

  const randomEncouragement = encouragements[totalCheckins % encouragements.length];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-3xl text-foreground">My Wellbeing</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Your energy journey over time</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="shadow-[var(--shadow-card)]">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
              <Activity className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">{totalCheckins}</p>
              <p className="text-xs text-muted-foreground">Check-ins</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-[var(--shadow-card)]">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-warning/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">{avgEnergy}%</p>
              <p className="text-xs text-muted-foreground">Avg energy</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-[var(--shadow-card)]">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-success/10 flex items-center justify-center">
              <Heart className="h-4 w-4 text-success" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">{currentStreak}d</p>
              <p className="text-xs text-muted-foreground">Streak</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Energy graph */}
      <Card className="shadow-[var(--shadow-card)]">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="font-sans text-sm">Energy over time</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {dailyData.length > 1 ? (
            <div className="h-32 flex items-end gap-[2px]">
              {dailyData.map((d, i) => {
                const hue = Math.round((d.avg / 100) * 120);
                return (
                  <motion.div
                    key={d.date}
                    initial={{ height: 0 }}
                    animate={{ height: `${d.avg}%` }}
                    transition={{ delay: i * 0.03, duration: 0.4 }}
                    className="flex-1 rounded-t-sm min-w-[4px]"
                    style={{ backgroundColor: `hsl(${hue}, 60%, 50%)` }}
                    title={`${d.date}: ${Math.round(d.avg)}%`}
                  />
                );
              })}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-sm text-muted-foreground">
              {totalCheckins === 0
                ? "Check in using the energy bar above to start tracking"
                : "One more check-in to see your graph"}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Milestones */}
      <Card className="shadow-[var(--shadow-card)]">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="font-sans text-sm flex items-center gap-1.5">
            <Award className="h-3.5 w-3.5 text-primary" />
            Milestones reached
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="space-y-2">
            {milestones.map((m) => {
              const reached = m.week <= weeksIn && totalCheckins > 0;
              return (
                <div
                  key={m.week}
                  className={`flex items-center gap-2 text-sm py-1.5 px-2 rounded-md transition-colors ${
                    reached ? "bg-success/5 text-foreground" : "text-muted-foreground/50"
                  }`}
                >
                  <div
                    className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-semibold ${
                      reached
                        ? "bg-success text-success-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {reached ? "✓" : m.week}
                  </div>
                  <span>{m.label}</span>
                  {reached && m.week === weeksIn && (
                    <span className="ml-auto text-xs text-success font-medium">Current</span>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Encouragement */}
      {totalCheckins > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-border bg-card p-4 text-center shadow-[var(--shadow-card)]"
        >
          <p className="text-sm text-foreground italic">"{randomEncouragement}"</p>
          <p className="text-xs text-muted-foreground mt-1">
            {daysSinceStart} days into your journey · {totalCheckins} check-ins logged
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default Wellbeing;
