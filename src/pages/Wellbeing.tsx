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

  // Group by day: average energy, count, and week label
  const dailyData = checkins.reduce<{ date: string; avg: number; count: number; weekDay: string }[]>((acc, c) => {
    const date = c.created_at.slice(0, 10);
    const existing = acc.find((d) => d.date === date);
    if (existing) {
      existing.avg = (existing.avg * existing.count + c.energy_level) / (existing.count + 1);
      existing.count++;
    } else {
      const d = new Date(c.created_at);
      const weekDay = d.toLocaleDateString(undefined, { weekday: "short" });
      acc.push({ date, avg: c.energy_level, count: 1, weekDay });
    }
    return acc;
  }, []);

  // Group days into weeks for labels
  const getWeekLabel = (dateStr: string) => {
    if (!checkins.length) return "";
    const start = new Date(checkins[0].created_at);
    const current = new Date(dateStr);
    const diffDays = Math.floor((current.getTime() - start.getTime()) / 86400000);
    const week = Math.floor(diffDays / 7);
    return `W${week}`;
  };

  const randomEncouragement = encouragements[totalCheckins % encouragements.length];

  // Identify week boundaries for labels
  const weekBoundaries = dailyData.reduce<{ startIdx: number; label: string }[]>((acc, d, i) => {
    const wk = getWeekLabel(d.date);
    if (i === 0 || wk !== getWeekLabel(dailyData[i - 1].date)) {
      acc.push({ startIdx: i, label: wk });
    }
    return acc;
  }, []);

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
          <CardTitle className="font-sans text-sm">Daily energy</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {dailyData.length > 0 ? (
            <div>
              <div className="h-36 flex items-end gap-1">
                {dailyData.map((d, i) => {
                  const avg = Math.round(d.avg);
                  const hue = Math.round((avg / 100) * 120);
                  return (
                    <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${avg}%` }}
                        transition={{ delay: i * 0.03, duration: 0.4 }}
                        className="w-full rounded-t-sm min-w-[6px] max-w-[24px] mx-auto relative"
                        style={{ backgroundColor: `hsl(${hue}, 60%, 50%)` }}
                      />
                      {/* Tooltip on hover */}
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 hidden group-hover:block
                        bg-foreground text-background text-[10px] px-2 py-1 rounded-md whitespace-nowrap z-10 shadow-lg">
                        {avg}% avg · {d.count} log{d.count > 1 ? "s" : ""}
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Day labels */}
              <div className="flex gap-1 mt-1">
                {dailyData.map((d) => (
                  <div key={d.date} className="flex-1 text-center">
                    <span className="text-[9px] text-muted-foreground">{d.weekDay}</span>
                  </div>
                ))}
              </div>
              {/* Week labels */}
              {weekBoundaries.length > 0 && (
                <div className="flex mt-0.5 relative" style={{ height: 14 }}>
                  {weekBoundaries.map((wb, i) => {
                    const nextStart = weekBoundaries[i + 1]?.startIdx ?? dailyData.length;
                    const span = nextStart - wb.startIdx;
                    return (
                      <div
                        key={wb.label}
                        className="text-center text-[9px] font-medium text-primary/70 border-t border-primary/20"
                        style={{ flex: span }}
                      >
                        {wb.label}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="h-36 flex items-center justify-center text-sm text-muted-foreground">
              Check in using the energy bar above to start tracking
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
