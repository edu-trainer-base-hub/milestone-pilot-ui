export type Screen = "setup" | "play";

export type Mode = "input" | "quiz";

export type MagnitudeMode = "digits" | "range";

export type TargetPlace = 10 | 100 | 1000;

export type SessionEndReason = "time" | "ex";

export interface TargetSelection {
  tens: boolean;
  hundreds: boolean;
  thousands: boolean;
}

export interface SessionConfig {
  mode: Mode;
  includeWhole: boolean;
  includeDecimals: boolean;
  decimalPlaces: number;
  includePositives: boolean;
  includeNegatives: boolean;
  magnitudeMode: MagnitudeMode;
  minDigits: number;
  maxDigits: number;
  minValue: number;
  maxValue: number;
  targets: TargetSelection;
  timerMinutes: number;
  maxExercises: number;
  soundsEnabled: boolean;
  includeTieCase: boolean;
  showHint: boolean;
}

export interface RoundingTask {
  original: number;
  target: TargetPlace;
  options: number[];
  taskId: number;
}

export interface HistoryItem {
  original: number;
  target: TargetPlace;
  user: number;
  correctRounded: number;
  correct: boolean;
  explanation: string;
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
  currentTask: RoundingTask | null;
  gameOver: boolean;
  endReason: SessionEndReason | null;
  readOnly: boolean;
}

export type ConfigUpdate = Partial<Omit<SessionConfig, "targets">> & {
  targets?: Partial<TargetSelection>;
};

export type TrainerAction =
  | { type: "configUpdated"; payload: ConfigUpdate }
  | { type: "sessionStarted" }
  | { type: "sessionFinished"; payload: { reason: SessionEndReason } }
  | { type: "newSessionRequested" }
  | { type: "returnedToSetup" }
  | { type: "taskPrepared"; payload: RoundingTask }
  | { type: "answerSubmitted"; payload: { item: HistoryItem; lastLine: string } }
  | { type: "stateReplaced"; payload: SessionState };
