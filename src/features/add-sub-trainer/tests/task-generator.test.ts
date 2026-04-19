import { describe, expect, it } from "vitest";
import { buildPrompt, generateTask } from "../lib/task-generator";
import { DEFAULT_CONFIG } from "../model/trainer.constants";
import type { SessionConfig } from "../model/trainer.types";

describe("task-generator", () => {
  it("should build prompt correctly for missing result", () => {
    const prompt = buildPrompt(5, 3, "add", "result");
    expect(prompt).toBe("5 + 3 = ?");
  });

  it("should build prompt correctly for missing a", () => {
    const prompt = buildPrompt(5, 3, "sub", "a");
    expect(prompt).toBe("? - 3 = 2");
  });

  it("should build prompt correctly for missing b", () => {
    const prompt = buildPrompt(5, 3, "add", "b");
    expect(prompt).toBe("5 + ? = 8");
  });

  it("should generate task for addition", () => {
    const config: SessionConfig = {
      ...DEFAULT_CONFIG,
      includeSub: false,
      minVal: 0,
      maxVal: 10,
      problemMode: "result",
    };
    const task = generateTask(config, 0);
    expect(task.op).toBe("add");
    expect(task.a).toBeGreaterThanOrEqual(0);
    expect(task.a).toBeLessThanOrEqual(10);
    expect(task.b).toBeGreaterThanOrEqual(0);
    expect(task.b).toBeLessThanOrEqual(10);
    expect(task.correctAnswer).toBe(task.a + task.b);
    expect(task.missing).toBe("result");
    expect(task.prompt).toBe(`${task.a} + ${task.b} = ?`);
  });

  it("should generate task for subtraction", () => {
    const config: SessionConfig = {
      ...DEFAULT_CONFIG,
      includeAdd: false,
      minVal: 0,
      maxVal: 10,
      problemMode: "result",
    };
    const task = generateTask(config, 0);
    expect(task.op).toBe("sub");
    expect(task.a).toBeGreaterThanOrEqual(task.b);
    expect(task.correctAnswer).toBe(task.a - task.b);
  });
});
