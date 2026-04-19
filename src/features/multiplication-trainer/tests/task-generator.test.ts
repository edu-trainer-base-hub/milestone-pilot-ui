import { describe, it, expect } from "vitest";
import { generateTask } from "../lib/task-generator";
import { DEFAULT_CONFIG } from "../model/trainer.constants";
import type { SessionConfig } from "../model/trainer.types";

describe("task-generator", () => {
  it("should generate a multiplication task when only includeMul is true", () => {
    const config: SessionConfig = {
      ...DEFAULT_CONFIG,
      includeMul: true,
      includeDiv: false,
    };

    const task = generateTask(config, 0);
    expect(task.op).toBe("mul");
    expect(task.correctAnswer).toBe(task.a * task.b);
  });

  it("should generate a division task when only includeDiv is true", () => {
    const config: SessionConfig = {
      ...DEFAULT_CONFIG,
      includeMul: false,
      includeDiv: true,
    };

    const task = generateTask(config, 0);
    expect(task.op).toBe("div");
    expect(task.a / task.b).toBe(task.correctAnswer);
  });

  it("should respect min/max limits for multiplicands", () => {
    const config: SessionConfig = {
      ...DEFAULT_CONFIG,
      minVal: 4,
      maxVal: 4,
      includeMul: true,
      includeDiv: false,
    };

    const task = generateTask(config, 0);
    const hasFour = task.a === 4 || task.b === 4;
    expect(hasFour).toBe(true);
  });

  it("should generate 4 options in quiz mode", () => {
    const config: SessionConfig = {
      ...DEFAULT_CONFIG,
      mode: "quiz",
    };

    const task = generateTask(config, 1);
    expect(task.options).toHaveLength(4);
    expect(task.options).toContain(task.correctAnswer);
  });

  it("should not generate options in input mode", () => {
    const config: SessionConfig = {
      ...DEFAULT_CONFIG,
      mode: "input",
    };

    const task = generateTask(config, 2);
    expect(task.options).toHaveLength(0);
  });
});
