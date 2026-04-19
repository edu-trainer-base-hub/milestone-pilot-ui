import { randInt } from "./math";
import { shuffle } from "./random";

export function generateOptions(correct: number): number[] {
  const opts = new Set<number>();
  opts.add(correct);
  const deltas = [1, 2, 3, 4, 5, -1, -2, -3, -4, -5];
  let attempts = 0;

  while (opts.size < 4 && attempts < 100) {
    const d = deltas[randInt(0, deltas.length - 1)];
    let candidate = correct + d;
    if (candidate < 0) candidate = Math.abs(candidate);
    if (candidate !== correct) opts.add(candidate);
    attempts++;
  }

  while (opts.size < 4) {
    const candidate = Math.max(0, correct + randInt(-9, 9));
    if (candidate !== correct) opts.add(candidate);
  }

  return shuffle(Array.from(opts)).slice(0, 4);
}
