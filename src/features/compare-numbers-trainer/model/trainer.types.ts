import type {
  CompareNumberTypeKey,
  CompareRelation,
  DecimalTypeConfig,
  FractionTypeConfig,
  GeneratedExercise,
  GeneratedValue,
  IntegerTypeConfig,
} from "@/lib/compare-numbers/generator";

export type Screen = "setup" | "play";

export type HistoryOrder = "asc" | "desc";

export type ModeKey = "nonNegative" | "signed" | "decimal" | "fraction";

export type EndReason = "time" | "ex" | "generator" | null;

export type SessionEndReason = Exclude<EndReason, null>;

export interface CompareNumbersSetupState {
  nonNegativeConfig: IntegerTypeConfig;
  signedConfig: IntegerTypeConfig;
  decimalConfig: DecimalTypeConfig;
  fractionConfig: FractionTypeConfig;
  openMode?: ModeKey;
  equalRatio: number;
  timerMinutes: number | null;
  maxExercises: number | null;
  historyOrder: HistoryOrder;
  enableSound: boolean;
  enableVibration: boolean;
}

export interface HistoryEntry {
  id: number;
  left: GeneratedValue;
  right: GeneratedValue;
  correctRelation: CompareRelation;
  userRelation: CompareRelation;
  isCorrect: boolean;
  timestamp: number;
}

export interface FeedbackState {
  type: "correct" | "wrong";
  userRelation: CompareRelation;
  correctRelation: CompareRelation;
}

export interface CompareNumbersSessionState {
  screen: Screen;
  correctCount: number;
  wrongCount: number;
  history: HistoryEntry[];
  exercise: GeneratedExercise | null;
  gameOver: boolean;
  endReason: EndReason;
  feedback: FeedbackState | null;
  taskId: number;
  sessionAnchor: number;
}

export type TypeAvailabilityMap = Record<CompareNumberTypeKey, boolean>;

export type CompareNumbersSessionAction =
  | { type: "sessionStarted"; payload: { exercise: GeneratedExercise | null } }
  | { type: "answerRegistered"; payload: { entry: HistoryEntry; feedback: FeedbackState; isCorrect: boolean } }
  | { type: "exerciseAdvanced"; payload: { exercise: GeneratedExercise | null } }
  | { type: "sessionFinished"; payload: { reason: SessionEndReason } }
  | { type: "returnedToSetup" };
