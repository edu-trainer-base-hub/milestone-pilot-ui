import { randInt } from "./math";
import { generateOptions } from "./quiz-options";
import type { Op, SessionConfig, TaskState } from "../model/trainer.types";

export function generateTask(config: SessionConfig, currentTaskId: number): TaskState {
  let chosenOp: Op = "mul";
  if (config.includeMul && config.includeDiv) {
    chosenOp = Math.random() < 0.5 ? "mul" : "div";
  } else if (config.includeDiv && !config.includeMul) {
    chosenOp = "div";
  }

  let na = 0;
  let nb = 0;
  let correct = 0;

  if (chosenOp === "mul") {
    na = randInt(config.minVal, config.maxVal);
    nb = randInt(1, 12);
    correct = na * nb;
  } else {
    // division
    const multiplicand = randInt(config.minVal, config.maxVal);
    const multiplier = randInt(1, 12);
    const product = multiplicand * multiplier;
    if (Math.random() < 0.5) {
      na = product;
      nb = multiplicand;
      correct = multiplier;
    } else {
      na = product;
      nb = multiplier;
      correct = multiplicand;
    }
  }

  let options: number[] = [];
  if (config.mode === "quiz") {
    options = generateOptions(correct);
  }

  return {
    a: na,
    b: nb,
    op: chosenOp,
    correctAnswer: correct,
    options,
    taskId: currentTaskId + 1,
  };
}
