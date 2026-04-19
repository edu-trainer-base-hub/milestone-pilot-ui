import { describe, expect, it } from "vitest";
import { getCheckDigitForPlace, roundHalfUpTo } from "../lib/rounding";
import { generateTask } from "../lib/task-generator";
import { DEFAULT_CONFIG } from "../model/trainer.constants";
import type { SessionConfig } from "../model/trainer.types";

describe("rounding task generator", () => {
  it("generates quiz options with exactly 4 values including the correct answer", () => {
    const config: SessionConfig = {
      ...DEFAULT_CONFIG,
      mode: "quiz",
      includeDecimals: false,
      includeWhole: true,
      targets: {
        tens: true,
        hundreds: false,
        thousands: false,
      },
    };

    const task = generateTask(config, 0, 0);
    expect(task.options).toHaveLength(4);
    expect(task.options).toContain(roundHalfUpTo(task.original, task.target));
  });

  it("does not generate options in input mode", () => {
    const config: SessionConfig = {
      ...DEFAULT_CONFIG,
      mode: "input",
    };

    const task = generateTask(config, 0, 0);
    expect(task.options).toHaveLength(0);
  });

  it("falls back to all targets when none are selected", () => {
    const config: SessionConfig = {
      ...DEFAULT_CONFIG,
      targets: {
        tens: false,
        hundreds: false,
        thousands: false,
      },
    };

    const task = generateTask(config, 0, 0);
    expect([10, 100, 1000]).toContain(task.target);
  });

  it("forces tie case for the first generated task when includeTieCase is enabled", () => {
    const config: SessionConfig = {
      ...DEFAULT_CONFIG,
      includeTieCase: true,
      includeDecimals: false,
      includeWhole: true,
      targets: {
        tens: true,
        hundreds: false,
        thousands: false,
      },
    };

    const task = generateTask(config, 0, 0);
    expect(getCheckDigitForPlace(task.original, task.target)).toBe(5);
  });
});
