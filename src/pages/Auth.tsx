import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { MessageSquare, Chrome, UserRound } from "lucide-react";

const Auth = () => {
  const { signInWithGoogle, signInAsGuest } = useAuth();

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

        <div className="space-y-3">
          <Button
            onClick={signInWithGoogle}
            className="w-full gap-2 bg-secondary text-secondary-foreground hover:bg-accent"
            size="lg"
          >
            <Chrome className="h-5 w-5" />
            Continue with Google
          </Button>

          <Button
            onClick={signInAsGuest}
            variant="outline"
            className="w-full gap-2"
            size="lg"
          >
            <UserRound className="h-5 w-5" />
            Continue as Guest
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
