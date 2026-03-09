import { motion } from "framer-motion";
import { Compass, Sparkles } from "lucide-react";

export function ChatEmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-sm space-y-3"
      >
        <div className="mx-auto h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <h3 className="font-serif text-xl text-foreground">Ask 6W anything</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Get factual answers about deadlines, policies, contacts, and resources — all grounded in approved Sloan content. 
          Every answer cites its source.
        </p>
        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground/70">
          <Compass className="h-3 w-3" />
          <span>Answers are sourced from verified institutional content</span>
        </div>
      </motion.div>
    </div>
  );
}
