import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import ThemeToggle from "@/components/ThemeToggle";
import { toast } from "sonner";
import { joinRoomByInviteCode } from "@/lib/room";

const JoinRoom = () => {
  const { code } = useParams<{ code: string }>();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    if (!code) {
      navigate("/home");
      return;
    }

    const joinByCode = async () => {
      try {
        const roomId = await joinRoomByInviteCode(user.uid, code);
        navigate(`/chat/${roomId}`);
      } catch (error: any) {
        toast.error(error.message || "Failed to join room");
        navigate("/home");
      }
    };

    joinByCode();
  }, [code, user, loading, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center relative">
      {/* Fixed Theme Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      
      <div className="flex gap-1">
        <div className="h-2 w-2 rounded-full bg-primary animate-pulse-dot" />
        <div className="h-2 w-2 rounded-full bg-primary animate-pulse-dot [animation-delay:0.2s]" />
        <div className="h-2 w-2 rounded-full bg-primary animate-pulse-dot [animation-delay:0.4s]" />
      </div>
    </div>
  );
};

export default JoinRoom;
