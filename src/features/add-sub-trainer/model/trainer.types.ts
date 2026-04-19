export type Screen = "setup" | "play";
export type Op = "add" | "sub";
export type ProblemMode = "result" | "missing";
export type PlayMode = "quiz" | "input";
export type MissingPart = "result" | "a" | "b";

export interface HistoryItem {
  id: number;
  prompt: string;
  userAnswer: string;
  correctAnswer: number;
  isCorrect: boolean;
}

export interface SessionConfig {
  includeAdd: boolean;
  includeSub: boolean;
  minVal: number;
  maxVal: number;
  problemMode: ProblemMode;
  playMode: PlayMode;
  timerMinutes: number;
  maxExercises: number;
  enableSounds: boolean;
}

export interface TaskState {
  a: number;
  b: number;
  op: Op;
  missing: MissingPart;
  correctAnswer: number;
  prompt: string;
  taskId: number;
}

export interface SessionProgress {
  correctCount: number;
  wrongCount: number;
  streak: number;
  bestStreak: number;
  history: HistoryItem[];
  lastFeedback: string | null;
  lastWasCorrect: boolean | null;
}

export interface SessionState {
  screen: Screen;
  config: SessionConfig;
  progress: SessionProgress;
  currentTask: TaskState | null;
  gameOver: boolean;
  endReason: "time" | "limit" | null;
  readOnly: boolean;
}

export type TrainerAction =
  | { type: "configUpdated"; payload: Partial<SessionConfig> }
  | { type: "sessionStarted" }
  | { type: "sessionFinished"; payload: { reason: "time" | "limit" } }
  | { type: "newSessionRequested" }
  | { type: "returnedToSetup" }
  | { type: "taskPrepared"; payload: TaskState }
  | {
      type: "answerSubmitted";
      payload: {
        userAnswer: string;
        correctAnswer: number;
        prompt: string;
        isCorrect: boolean;
        feedback?: string | null;
      };
    }
  | { type: "initFromConfig"; payload: SessionConfig }
  | { type: "stateReplaced"; payload: SessionState };
