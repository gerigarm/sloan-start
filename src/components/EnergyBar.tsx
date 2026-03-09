import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const energyLabels = [
  { max: 20, label: "Running on empty", emoji: "😴" },
  { max: 40, label: "A bit drained", emoji: "😕" },
  { max: 60, label: "Steady", emoji: "🙂" },
  { max: 80, label: "Feeling good", emoji: "😊" },
  { max: 100, label: "Fully charged", emoji: "⚡" },
];

const getEnergyInfo = (value: number) =>
  energyLabels.find((l) => value <= l.max) ?? energyLabels[4];

const EnergyBar = () => {
  const [energy, setEnergy] = useState(50);
  const [isOpen, setIsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastCheckin, setLastCheckin] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Check if user already checked in today
  useEffect(() => {
    if (!user) return;
    const today = new Date().toISOString().slice(0, 10);
    supabase
      .from("wellbeing_checkins")
      .select("created_at")
      .eq("user_id", user.id)
      .gte("created_at", today)
      .order("created_at", { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setLastCheckin(today);
        }
      });
  }, [user]);

  const alreadyCheckedIn = lastCheckin === new Date().toISOString().slice(0, 10);
  const info = getEnergyInfo(energy);

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);
    const { error } = await supabase.from("wellbeing_checkins").insert({
      user_id: user.id,
      energy_level: energy,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setLastCheckin(new Date().toISOString().slice(0, 10));
      setIsOpen(false);
      toast({ title: `${info.emoji} Logged!`, description: info.label });
    }
  };

  // Color based on energy
  const hue = Math.round((energy / 100) * 120); // 0=red, 120=green

  return (
    <div className="relative">
      {!alreadyCheckedIn ? (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card hover:bg-accent transition-colors text-xs font-medium text-foreground"
        >
          <Zap className="h-3.5 w-3.5 text-warning" />
          <span className="hidden sm:inline">How's your energy?</span>
          <span className="sm:hidden">Check in</span>
        </button>
      ) : (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-xs text-muted-foreground">
          <Check className="h-3.5 w-3.5 text-success" />
          <span className="hidden sm:inline">Checked in today</span>
        </div>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 z-50 w-72 rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-elevated)]"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-foreground">Energy check-in</span>
              <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="text-center">
                <span className="text-3xl">{info.emoji}</span>
                <p className="text-sm text-foreground font-medium mt-1">{info.label}</p>
              </div>

              {/* Custom slider track */}
              <div className="relative px-1">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={energy}
                  onChange={(e) => setEnergy(Number(e.target.value))}
                  className="w-full h-3 rounded-full appearance-none cursor-pointer outline-none
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2
                    [&::-webkit-slider-thumb]:border-card [&::-webkit-slider-thumb]:shadow-md
                    [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing
                    [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6
                    [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2
                    [&::-moz-range-thumb]:border-card [&::-moz-range-thumb]:shadow-md
                    [&::-moz-range-thumb]:cursor-grab"
                  style={{
                    background: `linear-gradient(to right, hsl(0, 70%, 55%), hsl(45, 90%, 55%), hsl(120, 55%, 45%))`,
                    // Thumb color
                    // @ts-ignore
                    "--thumb-color": `hsl(${hue}, 65%, 50%)`,
                  }}
                />
              </div>

              <div className="flex justify-between text-[10px] text-muted-foreground px-1">
                <span>Empty</span>
                <span>Charged</span>
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium
                  hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {submitting ? "Saving…" : "Log it ✓"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnergyBar;
