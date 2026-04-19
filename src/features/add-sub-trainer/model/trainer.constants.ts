import type { SessionConfig } from "./trainer.types";

export const DEFAULT_CONFIG: SessionConfig = {
  includeAdd: true,
  includeSub: true,
  minVal: 0,
  maxVal: 20,
  problemMode: "result",
  playMode: "quiz",
  timerMinutes: 0,
  maxExercises: 0,
  enableSounds: false,
};

export const MAX_HISTORY_ITEMS = 100;
