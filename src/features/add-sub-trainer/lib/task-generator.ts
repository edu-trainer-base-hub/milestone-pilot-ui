import type { SessionConfig, TaskState, Op, MissingPart } from "../model/trainer.types";
import { randInt } from "./math";

export function buildPrompt(a: number, b: number, op: Op, missing: MissingPart): string {
  const symbol = op === "add" ? "+" : "-";
  const result = op === "add" ? a + b : a - b;
  const parts = {
    a: missing === "a" ? "?" : String(a),
    b: missing === "b" ? "?" : String(b),
    result: missing === "result" ? "?" : String(result),
  } as const;
  return `${parts.a} ${symbol} ${parts.b} = ${parts.result}`;
}

export function generateTask(config: SessionConfig, currentTaskId: number): TaskState {
  const ops: Op[] = [];
  if (config.includeAdd) ops.push("add");
  if (config.includeSub) ops.push("sub");
  if (ops.length === 0) ops.push("add"); // fallback

  const op = ops[randInt(0, ops.length - 1)];
  const min = Math.min(config.minVal, config.maxVal);
  const max = Math.max(config.minVal, config.maxVal);

  const a = randInt(min, max);
  const b = randInt(min, max);

  const [x, y] = op === "sub" && a < b ? [b, a] : [a, b];

  const missing: MissingPart = config.problemMode === "result" ? "result" : randInt(0, 1) === 0 ? "a" : "b";

  const result = op === "add" ? x + y : x - y;

  let correctAnswer = result;
  if (missing === "a") correctAnswer = op === "add" ? result - y : result + y;
  if (missing === "b") correctAnswer = op === "add" ? result - x : x - result;

  const prompt = buildPrompt(x, y, op, missing);

  return {
    a: x,
    b: y,
    op,
    missing,
    correctAnswer,
    prompt,
    taskId: currentTaskId + 1,
  };
}
