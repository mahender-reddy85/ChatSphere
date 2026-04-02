import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { MessageSquare, Chrome, UserRound, AlertTriangle } from "lucide-react";
import { useState } from "react";

const Auth = () => {
  const { signInWithGoogle, signInAsGuest, firebaseReady } = useAuth();
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
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
            <MessageSquare className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">QuickChat</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Private 1:1 conversations with invite codes
          </p>
        </div>

        {!firebaseReady && (
          <div className="mb-4 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <div>
              <p className="text-sm font-medium text-destructive">Firebase Not Configured</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Open <code className="rounded bg-muted px-1 py-0.5 text-xs">src/lib/firebase.ts</code> and add your Firebase project credentials.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <Button
            onClick={handleGoogle}
            disabled={loadingGoogle || !firebaseReady}
            className="w-full gap-2 bg-secondary text-secondary-foreground hover:bg-accent"
            size="lg"
          >
            <Chrome className="h-5 w-5" />
            {loadingGoogle ? "Signing in..." : "Continue with Google"}
          </Button>

          <Button
            onClick={handleGuest}
            disabled={loadingGuest || !firebaseReady}
            variant="outline"
            className="w-full gap-2"
            size="lg"
          >
            <UserRound className="h-5 w-5" />
            {loadingGuest ? "Signing in..." : "Continue as Guest"}
          </Button>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Create or join private chat rooms instantly
        </p>
      </div>
    </div>
  );
};

export default Auth;
