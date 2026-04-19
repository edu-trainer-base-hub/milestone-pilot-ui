export type Op = "mul" | "div";

export type Screen = "setup" | "play";

export type Mode = "input" | "quiz";

export interface HistoryItem {
  a: number;
  b: number;
  answer: number;
  correct: boolean;
  op: Op;
}

export interface SessionConfig {
  minVal: number;
  maxVal: number;
  includeMul: boolean;
  includeDiv: boolean;
  timerMinutes: number; // 0 = unlimited
  maxExercises: number; // 0 = unlimited
  mode: Mode;
}

export interface TaskState {
  a: number;
  b: number;
  op: Op;
  correctAnswer: number;
  options: number[]; // empty if mode === 'input'
  taskId: number;
}

export interface SessionProgress {
  correctCount: number;
  wrongCount: number;
  history: HistoryItem[];
  lastLine: string;
  lastCorrect: boolean | null;
}

export interface SessionState {
  screen: Screen;
  config: SessionConfig;
  progress: SessionProgress;
  currentTask: TaskState | null;
  gameOver: boolean;
  endReason: "time" | "ex" | null;
  /** Allows the session state to be rendered purely as a spectator (read-only) */
  readOnly: boolean;
}

// Action Payloads layer

export type TrainerAction =
  | { type: "configUpdated"; payload: Partial<SessionConfig> }
  | { type: "sessionStarted" }
  | { type: "sessionFinished"; payload: { reason: "time" | "ex" } }
  | { type: "newSessionRequested" }
  | { type: "returnedToSetup" }
  | { type: "taskPrepared"; payload: TaskState }
  | { type: "answerSubmitted"; payload: { userOutput: number } }
  | { type: "initFromConfig"; payload: SessionConfig }
  | { type: "stateReplaced"; payload: SessionState };
