import { useCallback, useRef } from "react";
import { useSettings } from "@/contexts/SettingsContext";

const useNotificationSound = () => {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const { soundEnabled, vibrationEnabled } = useSettings();

  const play = useCallback(() => {
    // Vibration for mobile devices
    if (vibrationEnabled && 'vibrate' in navigator) {
      try {
        navigator.vibrate(200); // 200ms vibration
      } catch (error) {
        // Vibration not supported or failed
      }
    }

    // Sound notification
    if (!soundEnabled) return;

    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.connect(gain);
      gain.connect(ctx.destination);

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, ctx.currentTime);
      oscillator.frequency.setValueAtTime(1046, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.25);
    } catch {
      // Audio not available
    }
  }, [soundEnabled, vibrationEnabled]);

  return play;
};

export default useNotificationSound;
