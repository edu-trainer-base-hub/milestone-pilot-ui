import { DEFAULT_CONFIG, MAX_HISTORY_ITEMS } from "./trainer.constants";
import type { SessionState, TrainerAction } from "./trainer.types";

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
  if (state.readOnly && action.type !== "stateReplaced") {
    return state;
  }

  switch (action.type) {
    case "configUpdated": {
      return {
        ...state,
        config: {
          ...state.config,
          ...action.payload,
          targets: action.payload.targets
            ? {
                ...state.config.targets,
                ...action.payload.targets,
              }
            : state.config.targets,
        },
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

      const nextHistory = [action.payload.item, ...state.progress.history].slice(0, MAX_HISTORY_ITEMS);
      const isCorrect = action.payload.item.correct;

      return {
        ...state,
        progress: {
          ...state.progress,
          correctCount: isCorrect ? state.progress.correctCount + 1 : state.progress.correctCount,
          wrongCount: isCorrect ? state.progress.wrongCount : state.progress.wrongCount + 1,
          history: nextHistory,
          lastLine: action.payload.lastLine,
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
