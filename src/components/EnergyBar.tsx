import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Check, X, Plus } from "lucide-react";
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
  const [submitting, setSubmitting] = useState(false);
  const [checkedInToday, setCheckedInToday] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showSlider, setShowSlider] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;
    const today = new Date().toISOString().slice(0, 10);
    supabase
      .from("wellbeing_checkins")
      .select("created_at")
      .eq("user_id", user.id)
      .gte("created_at", today)
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) setCheckedInToday(true);
      });
  }, [user]);

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
      setCheckedInToday(true);
      setShowSlider(false);
      setDismissed(false);
      toast({ title: `${info.emoji} Logged!`, description: info.label });
    }
  };

  const needsFirstCheckin = !checkedInToday;
  const showBounce = needsFirstCheckin && !dismissed && !showSlider;
  const showBanner = (needsFirstCheckin && !dismissed) || showSlider;

  return (
    <>
      {/* Header element */}
      {showBounce ? (
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
          className="flex items-center gap-1.5 text-xs font-medium text-warning cursor-default"
        >
          <Zap className="h-4 w-4" />
          <span className="hidden sm:inline">Log your energy!</span>
        </motion.div>
      ) : checkedInToday && !showSlider ? (
        <button
          onClick={() => setShowSlider(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Log again</span>
        </button>
      ) : null}

      {/* Slider banner */}
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed top-14 left-0 right-0 z-40 overflow-hidden"
          >
            <div className="bg-card border-b border-border shadow-[var(--shadow-elevated)]">
              <div className="max-w-xl mx-auto px-4 py-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {needsFirstCheckin ? (
                      <motion.div
                        animate={{ rotate: [0, -10, 10, -10, 0] }}
                        transition={{ repeat: Infinity, duration: 2, repeatDelay: 3 }}
                      >
                        <Zap className="h-5 w-5 text-warning" />
                      </motion.div>
                    ) : (
                      <Zap className="h-5 w-5 text-muted-foreground" />
                    )}
                    <span className="text-sm font-medium text-foreground">
                      {needsFirstCheckin ? "How's your energy today?" : "Update your energy"}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      if (needsFirstCheckin) setDismissed(true);
                      setShowSlider(false);
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {needsFirstCheckin ? "Later" : "Cancel"}
                  </button>
                </div>

                <div className="text-center">
                  <motion.span
                    key={info.emoji}
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    className="text-4xl inline-block"
                  >
                    {info.emoji}
                  </motion.span>
                  <p className="text-sm text-foreground font-medium mt-1">{info.label}</p>
                </div>

                <div className="relative px-1">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={energy}
                    onChange={(e) => setEnergy(Number(e.target.value))}
                    className="w-full h-3 rounded-full appearance-none cursor-pointer outline-none
                      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7
                      [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2
                      [&::-webkit-slider-thumb]:border-card [&::-webkit-slider-thumb]:shadow-lg
                      [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing
                      [&::-moz-range-thumb]:w-7 [&::-moz-range-thumb]:h-7
                      [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2
                      [&::-moz-range-thumb]:border-card [&::-moz-range-thumb]:shadow-lg
                      [&::-moz-range-thumb]:cursor-grab"
                    style={{
                      background: `linear-gradient(to right, hsl(0, 70%, 55%), hsl(45, 90%, 55%), hsl(120, 55%, 45%))`,
                    }}
                  />
                </div>

                <div className="flex justify-between text-[10px] text-muted-foreground px-1">
                  <span>😴 Empty</span>
                  <span>Charged ⚡</span>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium
                    hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {submitting ? "Saving…" : "Log it ✓"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default EnergyBar;
