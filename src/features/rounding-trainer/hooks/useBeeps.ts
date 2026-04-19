import React from "react";

export function useBeeps(enabled: boolean) {
  const ctxRef = React.useRef<AudioContext | null>(null);

  const ensureContext = React.useCallback(async (): Promise<AudioContext | null> => {
    if (!enabled) return null;

    const AudioContextCtor =
      (globalThis as { AudioContext?: typeof AudioContext }).AudioContext ??
      (globalThis as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextCtor) return null;

    if (!ctxRef.current) {
      ctxRef.current = new AudioContextCtor();
    }

    const context = ctxRef.current;
    if (!context) return null;

    if (context.state === "suspended") {
      await context.resume();
    }

    return context;
  }, [enabled]);

  const beep = React.useCallback(
    async (frequency = 880, durationMs = 120, gainValue = 0.05) => {
      if (!enabled) return;
      const context = await ensureContext();
      if (!context) return;

      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.value = gainValue;
      oscillator.connect(gain).connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + durationMs / 1000);
    },
    [enabled, ensureContext]
  );

  const chord = React.useCallback(async () => {
    await beep(523.25, 140, 0.06);
    await beep(659.25, 140, 0.06);
    await beep(783.99, 160, 0.06);
  }, [beep]);

  React.useEffect(() => {
    return () => {
      const context = ctxRef.current;
      if (!context) return;
      void context.close().catch(() => undefined);
      ctxRef.current = null;
    };
  }, []);

  return {
    beep,
    chord,
  };
}
