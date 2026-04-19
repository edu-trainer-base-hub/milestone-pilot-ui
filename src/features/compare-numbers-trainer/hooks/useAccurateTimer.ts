import React from "react";

export function useAccurateTimer(active: boolean) {
  const [elapsedSec, setElapsedSec] = React.useState(0);
  const startRef = React.useRef<number | null>(null);
  const frameRef = React.useRef<number | null>(null);

  const step = React.useCallback((timestamp: number) => {
    if (startRef.current == null) {
      startRef.current = timestamp;
    }
    const seconds = Math.floor((timestamp - startRef.current) / 1000);
    setElapsedSec(seconds);
    frameRef.current = requestAnimationFrame(step);
  }, []);

  React.useEffect(() => {
    if (!active) {
      if (frameRef.current != null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      return;
    }
    frameRef.current = requestAnimationFrame(step);
    return () => {
      if (frameRef.current != null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [active, step]);

  const reset = React.useCallback(() => {
    startRef.current = null;
    setElapsedSec(0);
  }, []);

  return { elapsedSec, reset };
}
