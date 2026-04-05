import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ThemeToggle from "@/components/ThemeToggle";
import { toast } from "sonner";
import {
  Users,
  MessageSquare,
  Lock,
  Zap,
  ArrowRight,
  Mail,
  Chrome,
  UserRound,
} from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  const handleGetStarted = () => {
    navigate("/auth");
  };

  const handleJoinWithCode = () => {
    navigate("/join");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex items-center space-x-2">
            <span className="font-bold">ChatSphere</span>
          </div>
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <div className="w-full flex-1 md:w-auto md:flex-none">
              <Button
                variant="ghost"
                onClick={handleGetStarted}
                className="w-full md:w-auto"
              >
                Sign In
              </Button>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center text-center space-y-8">
          {/* Hero Content */}
          <div className="max-w-4xl space-y-6 animate-fade-in">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
                Private Chat,
                <br />
                <span className="text-primary">Simplified</span>
              </h1>
              <p className="text-xl text-muted-foreground sm:text-2xl max-w-2xl mx-auto">
                Create secure 1:1 chat rooms instantly with invite codes. 
                No registration required for guests, maximum privacy guaranteed.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={handleGetStarted}
                className="text-lg px-8 py-6"
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={handleJoinWithCode}
                className="text-lg px-8 py-6"
              >
                Join with Code
              </Button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl w-full mt-16">
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Private & Secure</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  End-to-end encrypted rooms with invite-only access. 
                  Your conversations stay private.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">1:1 Conversations</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Focused on intimate conversations. 
                  Maximum 2 participants per room.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Instant Setup</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  No complex registration. 
                  Join as guest or use your Google account instantly.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* How It Works */}
          <div className="max-w-4xl w-full mt-16 space-y-8">
            <h2 className="text-3xl font-bold text-center">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center space-y-4">
                <div className="mx-auto w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
                  1
                </div>
                <h3 className="font-semibold">Sign In</h3>
                <p className="text-muted-foreground text-sm">
                  Choose your preferred login method - Google, Email, or Guest
                </p>
              </div>
              <div className="text-center space-y-4">
                <div className="mx-auto w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
                  2
                </div>
                <h3 className="font-semibold">Create or Join</h3>
                <p className="text-muted-foreground text-sm">
                  Create a new room or join with an existing invite code
                </p>
              </div>
              <div className="text-center space-y-4">
                <div className="mx-auto w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
                  3
                </div>
                <h3 className="font-semibold">Start Chatting</h3>
                <p className="text-muted-foreground text-sm">
                  Enjoy private, real-time conversations with your partner
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              © 2026 ChatSphere
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
