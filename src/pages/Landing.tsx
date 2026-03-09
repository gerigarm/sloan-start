import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Compass, ArrowRight, CheckCircle2 } from "lucide-react";

const features = [
  "Personalized weekly priorities",
  "Grounded AI assistant with sources",
  "Wellbeing check-ins & support",
  "Everything you need — nothing you don't",
];

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Nav */}
      <header className="flex items-center justify-between px-6 py-4 md:px-12">
        <div className="flex items-center gap-2">
          <Compass className="h-6 w-6 text-primary" />
          <span className="font-serif text-xl text-foreground">Sloan 6W</span>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate("/auth")}>
          Sign in
        </Button>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-6 md:px-12">
        <div className="max-w-2xl text-center space-y-8">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="font-serif text-4xl md:text-6xl leading-tight text-foreground"
          >
            Your first weeks at Sloan,{" "}
            <span className="text-primary italic">simplified.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed"
          >
            Sloan Compass helps you navigate onboarding with clarity — personalized priorities,
            key deadlines, and an AI assistant grounded in real Sloan information.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Button size="lg" onClick={() => navigate("/auth")} className="gap-2">
              Get started <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>

          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="flex flex-col items-center gap-3 pt-4"
          >
            {features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                {f}
              </li>
            ))}
          </motion.ul>
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-muted-foreground">
        Built for MIT Sloan students · Sloan Compass
      </footer>
    </div>
  );
};

export default Landing;
