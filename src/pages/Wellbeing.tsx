import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, TrendingUp, Activity, Award, MessageCircle,
  Check, ChevronRight, Loader2, BarChart3, Shield, Zap
} from "lucide-react";
import { format, differenceInWeeks, startOfWeek, isSameWeek } from "date-fns";

// ─── Types ───────────────────────────────────────────────────────
interface DailyCheckin { energy_level: number; created_at: string }
interface WeeklyCheckin {
  id: string; stress_level: number; control_level: number;
  confidence_level: number; stress_causes: string[];
  week_number: number | null; created_at: string;
}

// ─── Constants ───────────────────────────────────────────────────
const STRESS_CAUSES = [
  "Too many deadlines", "Unclear priorities", "Recruiting pressure",
  "Too many events", "Admin / logistics", "Family / relocation",
];

const LEVEL_LABELS: Record<number, string> = {
  1: "Very low", 2: "Low", 3: "Moderate", 4: "High", 5: "Very high",
};

const CHATBOT_PROMPTS = [
  { label: "Help me prioritize this week", icon: "🎯" },
  { label: "What can I postpone?", icon: "⏸️" },
  { label: "What deadlines matter now?", icon: "📅" },
];

// ─── Demo data for skip-auth mode ────────────────────────────────
const isSkipAuth = () => localStorage.getItem("skip_auth") === "true";

const DEMO_DAILY: DailyCheckin[] = Array.from({ length: 14 }, (_, i) => ({
  energy_level: [
    45, 60, 55, 70, 50, 65, 75,
    60, 80, 55, 72, 68, 85, 78,
  ][i],
  created_at: new Date(Date.now() - (13 - i) * 86400000).toISOString(),
}));

const DEMO_WEEKLY: WeeklyCheckin[] = [
  { id: "d1", stress_level: 4, control_level: 2, confidence_level: 2, stress_causes: ["Too many deadlines", "Unclear priorities", "Family / relocation"], week_number: 0, created_at: new Date(Date.now() - 35 * 86400000).toISOString() },
  { id: "d2", stress_level: 4, control_level: 2, confidence_level: 3, stress_causes: ["Too many deadlines", "Admin / logistics"], week_number: 1, created_at: new Date(Date.now() - 28 * 86400000).toISOString() },
  { id: "d3", stress_level: 3, control_level: 3, confidence_level: 3, stress_causes: ["Recruiting pressure", "Too many events"], week_number: 2, created_at: new Date(Date.now() - 21 * 86400000).toISOString() },
  { id: "d4", stress_level: 3, control_level: 3, confidence_level: 4, stress_causes: ["Too many deadlines"], week_number: 3, created_at: new Date(Date.now() - 14 * 86400000).toISOString() },
  { id: "d5", stress_level: 2, control_level: 4, confidence_level: 4, stress_causes: ["Recruiting pressure"], week_number: 4, created_at: new Date(Date.now() - 7 * 86400000).toISOString() },
  { id: "d6", stress_level: 2, control_level: 4, confidence_level: 5, stress_causes: [], week_number: 5, created_at: new Date().toISOString() },
];

// ─── Hooks ───────────────────────────────────────────────────────
const useDailyCheckins = () => {
  const { user } = useAuth();
  const skipAuth = isSkipAuth();
  return useQuery({
    queryKey: ["wellbeing_daily", user?.id ?? "demo"],
    queryFn: async () => {
      if (skipAuth) return DEMO_DAILY;
      const { data, error } = await supabase
        .from("wellbeing_checkins")
        .select("energy_level, created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as DailyCheckin[];
    },
    enabled: !!user || skipAuth,
  });
};

const useWeeklyCheckins = () => {
  const { user } = useAuth();
  const skipAuth = isSkipAuth();
  return useQuery({
    queryKey: ["wellbeing_weekly", user?.id ?? "demo"],
    queryFn: async () => {
      if (skipAuth) return DEMO_WEEKLY;
      const { data, error } = await (supabase as any)
        .from("weekly_checkins")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as WeeklyCheckin[];
    },
    enabled: !!user || skipAuth,
  });
};

const useCurrentWeek = () => {
  const { user } = useAuth();
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("created_at").eq("user_id", user!.id).single();
      return data;
    },
    enabled: !!user,
  });
  if (!profile) return 0;
  return Math.min(Math.max(differenceInWeeks(new Date(), new Date(profile.created_at)), 0), 5);
};

// ─── Subcomponents ───────────────────────────────────────────────

function ScaleInput({ label, value, onChange, lowLabel, highLabel }: {
  label: string; value: number; onChange: (v: number) => void;
  lowLabel: string; highLabel: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-baseline">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <span className="text-xs text-muted-foreground">{LEVEL_LABELS[value]}</span>
      </div>
      <Slider value={[value]} onValueChange={([v]) => onChange(v)} min={1} max={5} step={1} />
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  );
}

function StressCausePicker({ selected, onChange }: {
  selected: string[]; onChange: (v: string[]) => void;
}) {
  const toggle = (cause: string) =>
    onChange(selected.includes(cause) ? selected.filter(c => c !== cause) : [...selected, cause]);

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">What's causing stress?</p>
      <div className="flex flex-wrap gap-2">
        {STRESS_CAUSES.map(cause => (
          <button
            key={cause}
            onClick={() => toggle(cause)}
            className={`px-3 py-1.5 rounded-lg border text-xs transition-all ${
              selected.includes(cause)
                ? "border-primary bg-primary/10 text-foreground font-medium"
                : "border-border text-muted-foreground hover:border-primary/40"
            }`}
          >
            {cause}
          </button>
        ))}
      </div>
    </div>
  );
}

function MiniTrendLine({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const max = 5;
  const w = 120;
  const h = 32;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`).join(" ");
  return (
    <svg width={w} height={h} className="shrink-0">
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
}

function SupportRecommendation({ latestWeekly, knowledgeSources }: {
  latestWeekly: WeeklyCheckin | null;
  knowledgeSources: any[];
}) {
  if (!latestWeekly) {
    return (
      <p className="text-xs text-muted-foreground italic">
        Complete a weekly check-in to get personalized support.
      </p>
    );
  }

  const highStress = latestWeekly.stress_level >= 4;
  const lowControl = latestWeekly.control_level <= 2;
  const lowConfidence = latestWeekly.confidence_level <= 2;

  // Pick focus/defer from knowledge sources
  const milestones = knowledgeSources.filter(s => s.content_type === "milestone");
  const contacts = knowledgeSources.filter(s => ["contact", "resource"].includes(s.content_type));

  const focusItem = milestones[0];
  const deferItem = milestones.length > 2 ? milestones[milestones.length - 1] : null;
  const supportContact = contacts.find(c =>
    highStress || lowControl
      ? c.title.toLowerCase().includes("mental") || c.title.toLowerCase().includes("counsel")
      : true
  ) || contacts[0];

  return (
    <div className="space-y-3">
      {(highStress || lowControl || lowConfidence) && (
        <div className="rounded-lg bg-primary/5 border border-primary/10 p-3">
          <p className="text-xs text-foreground leading-relaxed">
            {highStress && "Your stress is elevated this week. "}
            {lowControl && "You're feeling less in control. "}
            {lowConfidence && "Your priority confidence is low. "}
            That's completely normal during onboarding — here's what might help:
          </p>
        </div>
      )}

      <div className="space-y-2">
        {focusItem && (
          <div className="flex items-start gap-2">
            <div className="mt-0.5 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Zap className="h-3 w-3 text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium text-foreground">Focus on: {focusItem.title}</p>
              <p className="text-[11px] text-muted-foreground">{focusItem.content.slice(0, 80)}</p>
            </div>
          </div>
        )}

        {deferItem && (
          <div className="flex items-start gap-2">
            <div className="mt-0.5 h-5 w-5 rounded-full bg-muted flex items-center justify-center shrink-0">
              <Shield className="h-3 w-3 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs font-medium text-foreground">Can wait: {deferItem.title}</p>
              <p className="text-[11px] text-muted-foreground">{deferItem.content.slice(0, 80)}</p>
            </div>
          </div>
        )}

        {supportContact && (
          <div className="flex items-start gap-2">
            <div className="mt-0.5 h-5 w-5 rounded-full bg-success/10 flex items-center justify-center shrink-0">
              <Heart className="h-3 w-3 text-success" />
            </div>
            <div>
              <p className="text-xs font-medium text-foreground">{supportContact.title}</p>
              <p className="text-[11px] text-muted-foreground">{supportContact.content.slice(0, 80)}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────

const Wellbeing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const currentWeek = useCurrentWeek();

  const { data: dailyCheckins } = useDailyCheckins();
  const { data: weeklyCheckins } = useWeeklyCheckins();

  const { data: knowledgeSources } = useQuery({
    queryKey: ["knowledge_sources"],
    queryFn: async () => {
      const { data } = await supabase.from("knowledge_sources").select("*").eq("is_active", true);
      return data ?? [];
    },
  });

  // Weekly check-in form state
  const [stress, setStress] = useState(3);
  const [control, setControl] = useState(3);
  const [confidence, setConfidence] = useState(3);
  const [stressCauses, setStressCauses] = useState<string[]>([]);
  const [showWeeklyForm, setShowWeeklyForm] = useState(false);

  // Check if already done this week
  const doneThisWeek = useMemo(() => {
    if (!weeklyCheckins?.length) return false;
    const latest = weeklyCheckins[weeklyCheckins.length - 1];
    return isSameWeek(new Date(latest.created_at), new Date());
  }, [weeklyCheckins]);

  const submitWeekly = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).from("weekly_checkins").insert({
        user_id: user!.id,
        stress_level: stress,
        control_level: control,
        confidence_level: confidence,
        stress_causes: stressCauses,
        week_number: currentWeek,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wellbeing_weekly"] });
      setShowWeeklyForm(false);
      toast({ title: "Weekly check-in saved ✓" });
    },
  });

  const latestWeekly = weeklyCheckins?.length ? weeklyCheckins[weeklyCheckins.length - 1] : null;

  // Daily chart data
  const dailyData = useMemo(() => {
    if (!dailyCheckins?.length) return [];
    const grouped: Record<string, { total: number; count: number }> = {};
    dailyCheckins.forEach(c => {
      const date = c.created_at.slice(0, 10);
      if (!grouped[date]) grouped[date] = { total: 0, count: 0 };
      grouped[date].total += c.energy_level;
      grouped[date].count++;
    });
    return Object.entries(grouped).map(([date, { total, count }]) => ({
      date,
      avg: Math.round(total / count),
      weekDay: new Date(date).toLocaleDateString(undefined, { weekday: "short" }),
    }));
  }, [dailyCheckins]);

  // Trend data for weekly metrics
  const stressTrend = weeklyCheckins?.map(w => w.stress_level) ?? [];
  const controlTrend = weeklyCheckins?.map(w => w.control_level) ?? [];
  const confidenceTrend = weeklyCheckins?.map(w => w.confidence_level) ?? [];

  // Stats
  const totalDaily = dailyCheckins?.length ?? 0;
  const avgEnergy = totalDaily ? Math.round(dailyCheckins!.reduce((s, c) => s + c.energy_level, 0) / totalDaily) : 0;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-3xl text-foreground">My Wellbeing</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Week {currentWeek + 1} of 6 — Track your energy and mental clarity
        </p>
      </div>

      {/* ─── 1. Stats Row ─────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="shadow-[var(--shadow-card)]">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
              <Activity className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">{totalDaily}</p>
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
              <p className="text-2xl font-semibold text-foreground">{weeklyCheckins?.length ?? 0}</p>
              <p className="text-xs text-muted-foreground">Weekly logs</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── 2. Weekly Check-In ───────────────────────────── */}
      <Card className="shadow-[var(--shadow-card)]">
        <CardHeader className="pb-2 pt-4 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="font-sans text-sm flex items-center gap-1.5">
              <BarChart3 className="h-3.5 w-3.5 text-primary" />
              Weekly Check-In
            </CardTitle>
            {doneThisWeek && !showWeeklyForm && (
              <span className="text-[10px] text-success flex items-center gap-1">
                <Check className="h-3 w-3" /> Done this week
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <AnimatePresence mode="wait">
            {showWeeklyForm ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-5"
              >
                <ScaleInput
                  label="Stress level"
                  value={stress}
                  onChange={setStress}
                  lowLabel="Very calm"
                  highLabel="Very stressed"
                />
                <ScaleInput
                  label="Sense of control"
                  value={control}
                  onChange={setControl}
                  lowLabel="Out of control"
                  highLabel="Fully in control"
                />
                <ScaleInput
                  label="Confidence about priorities"
                  value={confidence}
                  onChange={setConfidence}
                  lowLabel="Very unsure"
                  highLabel="Very confident"
                />
                <StressCausePicker selected={stressCauses} onChange={setStressCauses} />

                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowWeeklyForm(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => submitWeekly.mutate()}
                    disabled={submitWeekly.isPending}
                    className="flex-1 text-xs gap-1"
                  >
                    {submitWeekly.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Check className="h-3 w-3" />
                    )}
                    Save weekly check-in
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="cta"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {latestWeekly && doneThisWeek ? (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg bg-muted/50 p-3 text-center">
                      <p className="text-lg font-semibold text-foreground">{latestWeekly.stress_level}/5</p>
                      <p className="text-[10px] text-muted-foreground">Stress</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3 text-center">
                      <p className="text-lg font-semibold text-foreground">{latestWeekly.control_level}/5</p>
                      <p className="text-[10px] text-muted-foreground">Control</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3 text-center">
                      <p className="text-lg font-semibold text-foreground">{latestWeekly.confidence_level}/5</p>
                      <p className="text-[10px] text-muted-foreground">Confidence</p>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full justify-between text-sm"
                    onClick={() => setShowWeeklyForm(true)}
                  >
                    <span>Take your weekly check-in</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>


      {/* ─── 4. Daily Energy Graph ────────────────────────── */}
      <Card className="shadow-[var(--shadow-card)]">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="font-sans text-sm">Daily energy</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {dailyData.length > 0 ? (
            <div>
              <div className="h-32 flex items-end gap-1">
                {dailyData.map((d, i) => {
                  const hue = Math.round((d.avg / 100) * 120);
                  const barHeight = Math.round((d.avg / 100) * 128); // 128px = h-32
                  return (
                    <div key={d.date} className="flex-1 flex flex-col justify-end items-center group relative h-full">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: barHeight }}
                        transition={{ delay: i * 0.03, duration: 0.3 }}
                        className="w-full rounded-t-sm min-w-[6px] max-w-[28px] mx-auto"
                        style={{ backgroundColor: `hsl(${hue}, 55%, 50%)` }}
                      />
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block
                        bg-foreground text-background text-[10px] px-2 py-0.5 rounded whitespace-nowrap z-10">
                        {d.avg}%
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-1 mt-1">
                {dailyData.map(d => (
                  <div key={d.date} className="flex-1 text-center">
                    <span className="text-[9px] text-muted-foreground">{d.weekDay}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic text-center py-6">
              Use the energy bar to start tracking daily energy
            </p>
          )}
        </CardContent>
      </Card>

      {/* ─── 5. Wellbeing Progress Over Time ──────────────── */}
      {weeklyCheckins && weeklyCheckins.length > 0 && (
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="font-sans text-sm flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              Progress Over Time
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-4">
            {/* Full-width trend chart */}
            <div className="relative">
              <svg viewBox="0 0 300 120" className="w-full h-28" preserveAspectRatio="none">
                {/* Grid lines */}
                {[0, 1, 2, 3, 4].map(i => (
                  <line key={i} x1="0" y1={i * 30} x2="300" y2={i * 30} stroke="hsl(var(--border))" strokeWidth="0.5" strokeDasharray="4 4" />
                ))}
                {/* Stress line */}
                <polyline
                  fill="none"
                  stroke="hsl(0, 60%, 55%)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={stressTrend.map((v, i) => `${(i / Math.max(stressTrend.length - 1, 1)) * 280 + 10},${120 - (v / 5) * 100}`).join(" ")}
                />
                {/* Control line */}
                <polyline
                  fill="none"
                  stroke="hsl(200, 60%, 50%)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={controlTrend.map((v, i) => `${(i / Math.max(controlTrend.length - 1, 1)) * 280 + 10},${120 - (v / 5) * 100}`).join(" ")}
                />
                {/* Confidence line */}
                <polyline
                  fill="none"
                  stroke="hsl(150, 55%, 45%)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={confidenceTrend.map((v, i) => `${(i / Math.max(confidenceTrend.length - 1, 1)) * 280 + 10},${120 - (v / 5) * 100}`).join(" ")}
                />
                {/* Data point dots */}
                {stressTrend.map((v, i) => (
                  <circle key={`s${i}`} cx={(i / Math.max(stressTrend.length - 1, 1)) * 280 + 10} cy={120 - (v / 5) * 100} r="3" fill="hsl(0, 60%, 55%)" />
                ))}
                {controlTrend.map((v, i) => (
                  <circle key={`c${i}`} cx={(i / Math.max(controlTrend.length - 1, 1)) * 280 + 10} cy={120 - (v / 5) * 100} r="3" fill="hsl(200, 60%, 50%)" />
                ))}
                {confidenceTrend.map((v, i) => (
                  <circle key={`cf${i}`} cx={(i / Math.max(confidenceTrend.length - 1, 1)) * 280 + 10} cy={120 - (v / 5) * 100} r="3" fill="hsl(150, 55%, 45%)" />
                ))}
              </svg>
              {/* Week labels */}
              <div className="flex justify-between px-2 mt-1">
                {weeklyCheckins.map((w, i) => (
                  <span key={w.id} className="text-[10px] text-muted-foreground">W{(w.week_number ?? i) + 1}</span>
                ))}
              </div>
            </div>

            {/* Legend with current values */}
            <div className="flex items-center gap-4 text-xs">
              {[
                { label: "Stress", data: stressTrend, color: "hsl(0, 60%, 55%)", inverted: true },
                { label: "Control", data: controlTrend, color: "hsl(200, 60%, 50%)", inverted: false },
                { label: "Confidence", data: confidenceTrend, color: "hsl(150, 55%, 45%)", inverted: false },
              ].map(metric => {
                const latest = metric.data[metric.data.length - 1];
                const prev = metric.data.length > 1 ? metric.data[metric.data.length - 2] : null;
                const delta = prev !== null ? latest - prev : 0;
                const improving = metric.inverted ? delta < 0 : delta > 0;
                return (
                  <div key={metric.label} className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: metric.color }} />
                    <span className="text-muted-foreground">{metric.label}</span>
                    <span className="font-semibold text-foreground">{latest}/5</span>
                    {delta !== 0 && (
                      <span className={`text-[10px] ${improving ? "text-success" : "text-destructive"}`}>
                        {delta > 0 ? "+" : ""}{delta}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── 6. Chatbot Shortcuts ─────────────────────────── */}
      <Card className="shadow-[var(--shadow-card)]">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="font-sans text-sm flex items-center gap-1.5">
            <MessageCircle className="h-3.5 w-3.5 text-primary" />
            Need help?
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="grid gap-2 sm:grid-cols-3">
            {CHATBOT_PROMPTS.map(prompt => (
              <button
                key={prompt.label}
                onClick={() => navigate(`/chat?q=${encodeURIComponent(prompt.label)}`)}
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-2.5
                  text-xs text-foreground hover:bg-accent/50 hover:border-primary/30 transition-all text-left"
              >
                <span className="text-base">{prompt.icon}</span>
                <span>{prompt.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ─── This Week's Support ─────────────────────────── */}
      <Card className="shadow-[var(--shadow-card)]">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="font-sans text-sm flex items-center gap-1.5">
            <Heart className="h-3.5 w-3.5 text-success" />
            This Week's Support
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <div className="mt-0.5 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Zap className="h-3 w-3 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium text-foreground">Take a break & recharge</p>
                <p className="text-[11px] text-muted-foreground">Enjoy a 20-minute session at the campus gym — stretch, move, reset.</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="mt-0.5 h-5 w-5 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                <Heart className="h-3 w-3 text-success" />
              </div>
              <div>
                <p className="text-xs font-medium text-foreground">Join a campus activity</p>
                <p className="text-[11px] text-muted-foreground">Check out yoga, meditation, or social clubs happening this week on campus.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Encouragement ────────────────────────────────── */}
      {totalDaily > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-border bg-card p-4 text-center shadow-[var(--shadow-card)]"
        >
          <p className="text-sm text-foreground italic">
            "You're showing up for yourself — that's what matters."
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {totalDaily} daily check-in{totalDaily !== 1 ? "s" : ""} · {weeklyCheckins?.length ?? 0} weekly log{(weeklyCheckins?.length ?? 0) !== 1 ? "s" : ""}
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default Wellbeing;
