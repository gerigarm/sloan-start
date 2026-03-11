import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { Compass, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // If already "logged in" via stored email, go to dashboard
  const storedEmail = localStorage.getItem("user_email");
  if (storedEmail) {
    const onboardingDone = localStorage.getItem(`onboarding_done_${storedEmail}`);
    return <Navigate to={onboardingDone === "true" ? "/dashboard" : "/onboarding"} replace />;
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !email.includes("@")) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    // Store email locally — no real auth for prototype
    localStorage.setItem("user_email", email.trim());
    localStorage.setItem("skip_auth", "true");

    // Check if onboarding was completed for this email
    const onboardingDone = localStorage.getItem(`onboarding_done_${email.trim()}`);
    if (onboardingDone === "true") {
      navigate("/dashboard");
    } else {
      navigate("/onboarding");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2">
          <Compass className="h-8 w-8 text-primary" />
          <h1 className="font-serif text-2xl text-foreground">Sloan 6W</h1>
          <p className="text-sm text-muted-foreground">Enter your email to get started</p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="font-sans text-lg">Welcome</CardTitle>
            <CardDescription>
              Enter your email to access your personalized pre-arrival guide.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Continue
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
