import { describe, expect, it } from "vitest";
import { generateOptions } from "../lib/quiz-options";

describe("generateOptions", () => {
  it("should generate 4 unique options including the correct answer", () => {
    const options = generateOptions(10);
    expect(options.length).toBe(4);
    expect(options.includes(10)).toBe(true);
    expect(new Set(options).size).toBe(4);
  });

  it("should generate options within the valid range", () => {
    const options = generateOptions(-500);
    expect(options.length).toBe(4);
    expect(options.includes(-500)).toBe(true);
  });
});
