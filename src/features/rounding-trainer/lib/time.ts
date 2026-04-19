export function formatTime(totalSec: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSec));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  const pad = (value: number) => value.toString().padStart(2, "0");
  return `${pad(minutes)}:${pad(seconds)}`;
}
