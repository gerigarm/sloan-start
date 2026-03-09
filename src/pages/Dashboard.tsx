import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarClock, ExternalLink, Flag, Pause, MessageCircle } from "lucide-react";
import JourneyGraph from "@/components/JourneyGraph";

const Dashboard = () => {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-3xl text-foreground">Your Week</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Personalized priorities and deadlines</p>
      </div>

      {/* Journey progress graph */}
      <JourneyGraph />

      {/* Compact panels grid */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="font-sans text-sm flex items-center gap-1.5">
              <Flag className="h-3.5 w-3.5 text-primary" />
              What Matters Now
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="rounded-md border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
              Top priorities — Step 4
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="font-sans text-sm flex items-center gap-1.5">
              <Pause className="h-3.5 w-3.5 text-muted-foreground" />
              What Can Wait
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="rounded-md border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
              Deferred items — Step 4
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="font-sans text-sm flex items-center gap-1.5">
              <CalendarClock className="h-3.5 w-3.5 text-destructive" />
              Key Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="rounded-md border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
              Deadlines — Step 4
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="font-sans text-sm flex items-center gap-1.5">
              <ExternalLink className="h-3.5 w-3.5 text-info" />
              Links & Contacts
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="rounded-md border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
              Resources — Step 4
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly note — compact */}
      <Card className="shadow-[var(--shadow-card)]">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="font-sans text-sm flex items-center gap-1.5">
            <MessageCircle className="h-3.5 w-3.5 text-success" />
            This Week's Note
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="rounded-md border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
            What's normal to feel right now — Step 4
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
