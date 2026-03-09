import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-foreground">Your Week</h1>
        <p className="text-muted-foreground mt-1">Personalized priorities and deadlines</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-sans text-base">What Matters Now</CardTitle>
            <CardDescription>Top priorities for this week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Personalized priorities — Step 4
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-sans text-base">What Can Wait</CardTitle>
            <CardDescription>Things you can safely defer</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Deferred items — Step 4
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-sans text-base">Key Deadlines</CardTitle>
            <CardDescription>Don't miss these dates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Deadlines list — Step 4
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-sans text-base">Useful Links & Contacts</CardTitle>
            <CardDescription>Key resources for this week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Links & contacts — Step 4
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-sans text-base">This Week's Note</CardTitle>
          <CardDescription>What's normal to feel right now</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Normalizing note — Step 4
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
