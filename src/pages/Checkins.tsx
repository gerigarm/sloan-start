import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart } from "lucide-react";

const Checkins = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-foreground">Check-ins</h1>
        <p className="text-muted-foreground mt-1">Quick wellbeing snapshots to help personalize your guidance</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            <CardTitle className="font-sans text-base">How are you doing?</CardTitle>
          </div>
          <CardDescription>
            Check-ins will be built in Step 7. They'll capture stress, control, and confidence levels.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Wellbeing check-in form coming soon
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Checkins;
