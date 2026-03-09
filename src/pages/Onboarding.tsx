import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Compass, ArrowRight, ArrowLeft, Check, GraduationCap, Globe, Home, Target, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

const STEPS = [
  { title: "Student Type", description: "What kind of student are you?" },
  { title: "Background", description: "Tell us about your situation" },
  { title: "Goals", description: "What matters most to you?" },
  { title: "Concerns", description: "What feels uncertain right now?" },
];

const STUDENT_TYPES = [
  { value: "mba", label: "MBA", icon: GraduationCap },
  { value: "mfin", label: "MFin", icon: GraduationCap },
  { value: "msms", label: "MSMS", icon: GraduationCap },
  { value: "phd", label: "PhD", icon: GraduationCap },
];

const RELOCATION_OPTIONS = [
  { value: "local", label: "Already local — no move needed" },
  { value: "domestic", label: "Moving from another U.S. city" },
  { value: "international", label: "Relocating internationally" },
  { value: "undecided", label: "Still figuring it out" },
];

const GOAL_OPTIONS = [
  "Get organized fast",
  "Build a social network",
  "Navigate admin & logistics",
  "Manage stress & wellbeing",
  "Prepare academically",
  "Explore career paths",
  "Find housing",
  "Connect with my cohort",
];

const CONCERN_OPTIONS = [
  "Feeling overwhelmed",
  "Missing deadlines",
  "Not knowing anyone",
  "Financial logistics",
  "Work-life balance",
  "Cultural adjustment",
  "Academic readiness",
  "Finding my community",
];

const OptionButton = ({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-all ${
      selected
        ? "border-primary bg-primary/10 text-foreground font-medium"
        : "border-border text-muted-foreground hover:border-primary/50 hover:bg-accent/50"
    }`}
  >
    {children}
  </button>
);

const ChipButton = ({ selected, onClick, label }: { selected: boolean; onClick: () => void; label: string }) => (
  <button
    onClick={onClick}
    className={`px-3 py-2 rounded-lg border text-sm transition-all ${
      selected
        ? "border-primary bg-primary/10 text-foreground font-medium"
        : "border-border text-muted-foreground hover:border-primary/50 hover:bg-accent/50"
    }`}
  >
    {label}
  </button>
);

const Onboarding = () => {
  const [step, setStep] = useState(0);
  const [studentType, setStudentType] = useState("");
  const [isInternational, setIsInternational] = useState<boolean | null>(null);
  const [relocation, setRelocation] = useState("");
  const [goals, setGoals] = useState<string[]>([]);
  const [concerns, setConcerns] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const toggleArray = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];

  const canProceed = () => {
    if (step === 0) return !!studentType;
    if (step === 1) return isInternational !== null && !!relocation;
    if (step === 2) return goals.length > 0;
    if (step === 3) return concerns.length > 0;
    return true;
  };

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        student_type: studentType,
        is_international: isInternational,
        relocation_status: relocation,
        primary_goals: goals,
        concerns,
        onboarding_completed: true,
      } as any)
      .eq("user_id", user.id);

    if (error) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
      setSaving(false);
      return;
    }
    navigate("/dashboard");
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="flex flex-col items-center gap-2 text-center">
          <Compass className="h-8 w-8 text-primary" />
          <h1 className="font-serif text-2xl text-foreground">Tell us about yourself</h1>
          <p className="text-sm text-muted-foreground">This helps us personalize your 6-week experience.</p>
        </div>

        {/* Progress */}
        <div className="flex gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="shadow-[var(--shadow-card)]">
              <CardContent className="p-6 space-y-4">
                <div>
                  <h2 className="font-sans font-semibold text-foreground">{STEPS[step].title}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">{STEPS[step].description}</p>
                </div>

                {step === 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {STUDENT_TYPES.map((t) => (
                      <OptionButton key={t.value} selected={studentType === t.value} onClick={() => setStudentType(t.value)}>
                        <div className="flex items-center gap-2">
                          <t.icon className="h-4 w-4" />
                          {t.label}
                        </div>
                      </OptionButton>
                    ))}
                  </div>
                )}

                {step === 1 && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
                        <Globe className="h-3.5 w-3.5" /> Are you an international student?
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <OptionButton selected={isInternational === true} onClick={() => setIsInternational(true)}>
                          Yes
                        </OptionButton>
                        <OptionButton selected={isInternational === false} onClick={() => setIsInternational(false)}>
                          No
                        </OptionButton>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
                        <Home className="h-3.5 w-3.5" /> Relocation status
                      </p>
                      <div className="space-y-1.5">
                        {RELOCATION_OPTIONS.map((o) => (
                          <OptionButton key={o.value} selected={relocation === o.value} onClick={() => setRelocation(o.value)}>
                            {o.label}
                          </OptionButton>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
                      <Target className="h-3.5 w-3.5" /> Select all that apply
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {GOAL_OPTIONS.map((g) => (
                        <ChipButton key={g} selected={goals.includes(g)} onClick={() => setGoals(toggleArray(goals, g))} label={g} />
                      ))}
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5" /> Select all that apply
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {CONCERN_OPTIONS.map((c) => (
                        <ChipButton key={c} selected={concerns.includes(c)} onClick={() => setConcerns(toggleArray(concerns, c))} label={c} />
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep(step - 1)}
            disabled={step === 0}
            className="gap-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </Button>

          {step < STEPS.length - 1 ? (
            <Button
              size="sm"
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="gap-1"
            >
              Next <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleFinish}
              disabled={!canProceed() || saving}
              className="gap-1"
            >
              <Check className="h-3.5 w-3.5" /> {saving ? "Saving…" : "Finish"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
