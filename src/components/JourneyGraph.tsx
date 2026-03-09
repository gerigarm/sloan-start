import { CheckCircle2, Circle, Lock } from "lucide-react";
import { motion } from "framer-motion";

interface Milestone {
  week: number;
  label: string;
  status: "completed" | "current" | "upcoming";
}

const milestones: Milestone[] = [
  { week: -2, label: "Pre-arrival prep", status: "completed" },
  { week: -1, label: "Campus orientation", status: "completed" },
  { week: 0, label: "Classes begin", status: "current" },
  { week: 1, label: "Find your rhythm", status: "upcoming" },
  { week: 2, label: "Build your network", status: "upcoming" },
  { week: 3, label: "Midpoint check-in", status: "upcoming" },
  { week: 4, label: "Deepen engagement", status: "upcoming" },
  { week: 5, label: "Reflect & adjust", status: "upcoming" },
  { week: 6, label: "Make it yours", status: "upcoming" },
];

const JourneyGraph = () => {
  const currentIndex = milestones.findIndex((m) => m.status === "current");
  const progress = ((currentIndex + 1) / milestones.length) * 100;

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h2 className="font-serif text-xl text-foreground">Your Sloan Journey</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Week {milestones[currentIndex]?.week ?? 0} of 6 — {milestones[currentIndex]?.label}
          </p>
        </div>
        <span className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full">
          {Math.round(progress)}% complete
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative mt-4 mb-2">
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>

        {/* Milestone dots */}
        <div className="flex justify-between mt-2">
          {milestones.map((m, i) => (
            <div key={m.week} className="flex flex-col items-center" style={{ width: `${100 / milestones.length}%` }}>
              <div className="mb-1">
                {m.status === "completed" ? (
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                ) : m.status === "current" ? (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    <Circle className="h-4 w-4 text-primary fill-primary" />
                  </motion.div>
                ) : (
                  <Lock className="h-3.5 w-3.5 text-muted-foreground/50" />
                )}
              </div>
              <span
                className={`text-[10px] leading-tight text-center ${
                  m.status === "current"
                    ? "font-semibold text-primary"
                    : m.status === "completed"
                    ? "text-foreground"
                    : "text-muted-foreground/60"
                }`}
              >
                {m.week < 0 ? `W${m.week}` : m.week === 0 ? "Start" : `W${m.week}`}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Goal message */}
      <p className="text-[11px] text-muted-foreground text-center mt-3">
        🎯 By Week 6 you'll be fully onboarded and ready to make your own Sloan with confidence
      </p>
    </div>
  );
};

export default JourneyGraph;
