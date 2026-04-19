import type { SessionState, TrainerAction } from "./trainer.types";
import { DEFAULT_CONFIG, MAX_HISTORY_ITEMS } from "./trainer.constants";

export const initialTrainerState: SessionState = {
  screen: "setup",
  config: DEFAULT_CONFIG,
  progress: {
    correctCount: 0,
    wrongCount: 0,
    history: [],
    lastLine: "",
    lastCorrect: null,
  },
  currentTask: null,
  gameOver: false,
  endReason: null,
  readOnly: false,
};

export function trainerReducer(state: SessionState, action: TrainerAction): SessionState {
  // If we are in read-only mode, we only accept full state replacements
  if (state.readOnly && action.type !== "stateReplaced") {
    return state;
  }

  switch (action.type) {
    case "configUpdated": {
      return {
        ...state,
        config: { ...state.config, ...action.payload },
      };
    }

    case "initFromConfig": {
      return {
        ...initialTrainerState,
        config: { ...initialTrainerState.config, ...action.payload },
        screen: "setup",
        readOnly: false,
      };
    }

    case "stateReplaced": {
      return action.payload;
    }

    case "sessionStarted": {
      return {
        ...state,
        screen: "play",
        gameOver: false,
        endReason: null,
        progress: {
          correctCount: 0,
          wrongCount: 0,
          history: [],
          lastLine: "",
          lastCorrect: null,
        },
      };
    }

    case "taskPrepared": {
      return {
        ...state,
        currentTask: action.payload,
      };
    }

    case "answerSubmitted": {
      if (!state.currentTask || state.gameOver) return state;
      const { userOutput } = action.payload;
      const t = state.currentTask;

      const isCorrect = userOutput === t.correctAnswer;
      const newItem = { a: t.a, b: t.b, op: t.op, answer: userOutput, correct: isCorrect };

      const newHistory = [newItem, ...state.progress.history].slice(0, MAX_HISTORY_ITEMS);
      const lastLine = `${t.a} ${t.op === "mul" ? "×" : "÷"} ${t.b} = ${userOutput}`;

      return {
        ...state,
        progress: {
          ...state.progress,
          correctCount: isCorrect ? state.progress.correctCount + 1 : state.progress.correctCount,
          wrongCount: !isCorrect ? state.progress.wrongCount + 1 : state.progress.wrongCount,
          history: newHistory,
          lastLine,
          lastCorrect: isCorrect,
        },
      };
    }

    case "sessionFinished": {
      return {
        ...state,
        gameOver: true,
        endReason: action.payload.reason,
      };
    }

    case "newSessionRequested": {
      return {
        ...state,
        gameOver: false,
        endReason: null,
        progress: {
          correctCount: 0,
          wrongCount: 0,
          history: [],
          lastLine: "",
          lastCorrect: null,
        },
        currentTask: null,
      };
    }

    case "returnedToSetup": {
      return {
        ...state,
        screen: "setup",
        gameOver: false,
        endReason: null,
        progress: {
          correctCount: 0,
          wrongCount: 0,
          history: [],
          lastLine: "",
          lastCorrect: null,
        },
        currentTask: null,
      };
    }

    default:
      return state;
  }
}
