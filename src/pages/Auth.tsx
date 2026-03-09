import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Compass, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Compass className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.endsWith("@mit.edu")) {
      toast({
        title: "Invalid email",
        description: "Please use your MIT email address (@mit.edu).",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin + "/dashboard",
        },
      });
      if (error) throw error;
      setSent(true);
      toast({
        title: "Check your MIT email",
        description: "We sent you a magic link to sign in.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2">
          <Compass className="h-8 w-8 text-primary" />
          <h1 className="font-serif text-2xl text-foreground">Sloan 6W</h1>
          <p className="text-sm text-muted-foreground">Sign in with your MIT email</p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="font-sans text-lg">
              {sent ? "Check your inbox" : "Welcome"}
            </CardTitle>
            <CardDescription>
              {sent
                ? "Click the link we sent to your MIT email to sign in."
                : "Enter your @mit.edu email to receive a sign-in link."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="space-y-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Didn't receive it?
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setSent(false)}
                >
                  Try again
                </Button>
              </div>
            ) : (
              <form onSubmit={handleMagicLink} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">MIT Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@mit.edu"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Send magic link
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <Button
          variant="ghost"
          className="w-full text-xs text-muted-foreground hover:text-foreground"
          onClick={() => navigate("/dashboard")}
        >
          Skip for now →
        </Button>
      </div>
    </div>
  );
};

export default Auth;
