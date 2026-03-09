import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Compass } from "lucide-react";

const Onboarding = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="flex flex-col items-center gap-2">
          <Compass className="h-8 w-8 text-primary" />
          <h1 className="font-serif text-2xl text-foreground">Tell us about yourself</h1>
          <p className="text-sm text-muted-foreground">This helps us personalize your experience.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-sans text-lg">Onboarding Intake</CardTitle>
            <CardDescription>
              The onboarding flow will be built in Step 3. It will capture your program, goals, concerns, and preferences in about 3 minutes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Multi-step onboarding form coming soon
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Onboarding;
