import React from "react";

export function useAccurateTimer(active: boolean) {
  const [elapsedSec, setElapsedSec] = React.useState(0);
  const startRef = React.useRef<number | null>(null);
  const rafRef = React.useRef<number | null>(null);

  const step = React.useCallback((time: number) => {
    if (startRef.current == null) startRef.current = time;
    const seconds = Math.floor((time - startRef.current) / 1000);
    setElapsedSec(seconds);
    rafRef.current = requestAnimationFrame(step);
  }, []);

  React.useEffect(() => {
    if (!active) return;
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [active, step]);

  const reset = React.useCallback(() => {
    startRef.current = null;
    setElapsedSec(0);
  }, []);

  return {
    elapsedSec,
    reset,
  };
}
