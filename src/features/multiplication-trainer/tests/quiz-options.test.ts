import { describe, it, expect } from "vitest";
import { generateOptions } from "../lib/quiz-options";

describe("quiz-options generator", () => {
  it("should always generate exactly 4 options", () => {
    const opts = generateOptions(42);
    expect(opts).toHaveLength(4);
  });

  it("should always include the correct answer", () => {
    const correct = 100;
    const opts = generateOptions(correct);
    expect(opts).toContain(correct);
  });

  it("should not contain duplicate options", () => {
    const opts = generateOptions(25);
    const unique = new Set(opts);
    expect(unique.size).toBe(4);
  });

  it("should not generate negative numbers", () => {
    const opts = generateOptions(2);
    opts.forEach((opt) => {
      expect(opt).toBeGreaterThanOrEqual(0);
    });
  });
});
