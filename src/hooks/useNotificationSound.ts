import { useCallback, useRef, useEffect } from "react";
import { useSettings } from "@/contexts/SettingsContext";

const useNotificationSound = () => {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const { soundEnabled, vibrationEnabled } = useSettings();
  const hasInteracted = useRef(false);

  // Set up user interaction detection
  useEffect(() => {
    const handleUserInteraction = () => {
      hasInteracted.current = true;
    };

    // Listen for user interactions
    const events = ['click', 'keydown', 'touchstart', 'mousedown'];
    events.forEach(event => {
      document.addEventListener(event, handleUserInteraction, { once: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserInteraction);
      });
    };
  }, []);

  const play = useCallback(() => {
    // Only play if user has interacted with the page
    if (!hasInteracted.current) return;

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
      // Create audio context on first user interaction
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtxRef.current = new AudioContextClass();
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
  }, [soundEnabled, vibrationEnabled, hasInteracted]);

  return play;
};

export default useNotificationSound;
