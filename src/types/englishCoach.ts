/* ───────── English Coach Chat – domain types ───────── */

export const MessageRole = {
  USER: "user",
  ASSISTANT: "assistant",
  SYSTEM: "system",
} as const;
export type MessageRole = (typeof MessageRole)[keyof typeof MessageRole];

export const InputMode = {
  VOICE: "voice",
  TEXT: "text",
} as const;
export type InputMode = (typeof InputMode)[keyof typeof InputMode];

export const Difficulty = {
  EASY: "easy",
  MEDIUM: "medium",
  HARD: "hard",
} as const;
export type Difficulty = (typeof Difficulty)[keyof typeof Difficulty];

export interface CoachFeedback {
  score: number;
  grammarNotes: string[];
  fluencyNotes: string[];
  vocabularyNotes: string[];
}

export interface PracticeTask {
  title: string;
  instructions: string;
  difficulty: Difficulty;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface CoachMessage {
  uuid: string;
  role: MessageRole;
  text: string;
  createdAt: string; // ISO 8601
  audioUrl?: string;
  inputMode?: InputMode;
  feedback?: CoachFeedback;
  nextPractice?: PracticeTask;
  usage?: TokenUsage;
}

export interface SessionProgressState {
  stage?: string;
  completedExercises?: number;
  taskIndex?: number;
  [key: string]: any;
}

export interface SessionUserPreferences {
  targetAccent?: string;
  correctionMode?: string;
  hintLevel?: string;
  [key: string]: any;
}

export interface SessionAnalytics {
  avgResponseSeconds?: number;
  messagesCount?: number;
  [key: string]: any;
}

export interface CoachSession {
  uuid: string;
  title: string;
  deleted: boolean;
  progressState?: SessionProgressState | null;
  userPreferences?: SessionUserPreferences | null;
  analytics?: SessionAnalytics | null;
  inputTokensUsed: number;
  outputTokensUsed: number;
  totalTokensUsed: number;
  llmContextLimit: number | null;
  full: boolean;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  messages: CoachMessage[];
}

/* ───────── API request / response shapes ───────── */

export interface CoachReplyRequest {
  sessionId: string;
  messages: Pick<CoachMessage, "role" | "text">[];
  userLevel?: string;
  lessonMode?: string;
}

export interface CoachReplyResponse {
  message: CoachMessage;
  nextPractice?: PracticeTask | null;
  usage?: TokenUsage | null;
}

export interface SynthesizeSpeechRequest {
  text: string;
  sessionId: string;
  voice?: string;
}

export interface TranscribeResponse {
  transcript: string;
}

/* ───────── Voice recorder state ───────── */

export const RecorderStatus = {
  IDLE: "idle",
  RECORDING: "recording",
  PROCESSING: "processing",
} as const;
export type RecorderStatus = (typeof RecorderStatus)[keyof typeof RecorderStatus];
