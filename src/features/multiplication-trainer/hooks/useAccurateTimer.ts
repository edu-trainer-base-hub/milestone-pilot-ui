import React from "react";

/**
 * requestAnimationFrame-based timer with self-correcting elapsed seconds.
 * Avoids setInterval drift and keeps 1s resolution accurate across tab throttling.
 * Extracted from original monolith.
 */
export function useAccurateTimer(active: boolean) {
  const [elapsedSec, setElapsedSec] = React.useState(0);
  const startRef = React.useRef<number | null>(null);
  const rafRef = React.useRef<number | null>(null);

  const step = React.useCallback((t: number) => {
    if (startRef.current == null) startRef.current = t;
    const seconds = Math.floor((t - startRef.current) / 1000);
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

  return { elapsedSec, reset };
}
