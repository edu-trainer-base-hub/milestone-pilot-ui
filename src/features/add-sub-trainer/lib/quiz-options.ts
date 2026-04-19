import { randInt } from "./math";

export function generateOptions(correct: number): number[] {
  const opts = new Set<number>();
  opts.add(correct);
  const deltas = [1, 2, 3, 4, 5, -1, -2, -3, -4, -5];

  let attempts = 0;
  while (opts.size < 4 && attempts < 100) {
    const delta = deltas[randInt(0, deltas.length - 1)];
    const candidate = correct + delta;
    if (candidate !== correct && candidate >= -1000 && candidate <= 1000) {
      opts.add(candidate);
    }
    attempts++;
  }

  while (opts.size < 4) {
    const candidate = correct + randInt(-9, 9);
    if (candidate !== correct) opts.add(candidate);
  }

  return Array.from(opts).sort(() => Math.random() - 0.5);
}
