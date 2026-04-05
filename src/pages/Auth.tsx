import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ThemeToggle from "@/components/ThemeToggle";
import { Chrome, UserRound, AlertTriangle, Mail, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Auth = () => {
  const { signInWithGoogle, signInAsGuest, firebaseReady } = useAuth();
  const navigate = useNavigate();
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingGuest, setLoadingGuest] = useState(false);

  const handleGoogle = async () => {
    setLoadingGoogle(true);
    try {
      await signInWithGoogle();
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleGuest = async () => {
    setLoadingGuest(true);
    try {
      await signInAsGuest();
    } finally {
      setLoadingGuest(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4 relative">
      {/* Fixed Theme Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Back Button */}
      <div className="fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(-1)}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>
      
      <div className="w-full max-w-md animate-fade-in">
        {/* Header Card */}
        <Card className="mb-6 border-0 shadow-none bg-transparent">
          <CardContent className="text-center p-0">
            <h1 className="text-3xl font-bold text-foreground mb-6">ChatSphere</h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Private 1:1 conversations with invite codes
            </p>
          </CardContent>
        </Card>

        {/* Firebase Warning */}
        {!firebaseReady && (
          <Card className="mb-6 border-destructive/30 bg-destructive/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                <div>
                  <p className="text-sm font-medium text-destructive">Firebase Not Configured</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Open <code className="rounded bg-muted px-1 py-0.5 text-xs">src/lib/firebase.ts</code> and add your Firebase project credentials.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Auth Options Card */}
        <Card className="border-0 shadow-xl bg-background/80 backdrop-blur-sm">
          <CardContent className="p-6 space-y-4">
            <div className="space-y-3">
              <Button
                onClick={() => navigate("/email-auth")}
                variant="outline"
                className="w-full gap-3 h-12 text-base border-2 hover:bg-accent hover:border-accent transition-all"
                size="lg"
              >
                <Mail className="h-5 w-5" />
                Continue with Email
              </Button>

              <Button
                onClick={handleGoogle}
                disabled={loadingGoogle || !firebaseReady}
                className="w-full gap-3 h-12 text-base bg-secondary text-secondary-foreground hover:bg-accent shadow-md transition-all hover:shadow-lg"
                size="lg"
              >
                <Chrome className="h-5 w-5" />
                {loadingGoogle ? "Signing in..." : "Continue with Google"}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border"></span>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">or</span>
                </div>
              </div>

              <Button
                onClick={handleGuest}
                disabled={loadingGuest || !firebaseReady}
                variant="outline"
                className="w-full gap-3 h-12 text-base border-2 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
                size="lg"
              >
                <UserRound className="h-5 w-5" />
                {loadingGuest ? "Signing in..." : "Continue as Guest"}
              </Button>
            </div>

            <div className="pt-4 text-center border-t">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Create or join private chat rooms instantly
              </p>
              <div className="mt-2 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <span>No registration required</span>
                <span>•</span>
                <span>End-to-end encryption</span>
                <span>•</span>
                <span>100% private</span>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default Auth;
