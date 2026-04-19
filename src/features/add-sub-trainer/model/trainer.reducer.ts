import type { SessionState, TrainerAction } from "./trainer.types";
import { DEFAULT_CONFIG, MAX_HISTORY_ITEMS } from "./trainer.constants";

export function getInitialState(overrides?: Partial<SessionState>): SessionState {
  return {
    screen: "setup",
    config: DEFAULT_CONFIG,
    progress: {
      correctCount: 0,
      wrongCount: 0,
      streak: 0,
      bestStreak: 0,
      history: [],
      lastFeedback: null,
      lastWasCorrect: null,
    },
    currentTask: null,
    gameOver: false,
    endReason: null,
    readOnly: false,
    ...overrides,
  };
}

export function trainerReducer(state: SessionState, action: TrainerAction): SessionState {
  if (state.readOnly && action.type !== "stateReplaced") {
    return state;
  }

  switch (action.type) {
    case "configUpdated":
      return {
        ...state,
        config: { ...state.config, ...action.payload },
      };

    case "sessionStarted":
      return {
        ...state,
        screen: "play",
        progress: {
          correctCount: 0,
          wrongCount: 0,
          streak: 0,
          bestStreak: 0,
          history: [],
          lastFeedback: null,
          lastWasCorrect: null,
        },
        gameOver: false,
        endReason: null,
        currentTask: null,
      };

    case "sessionFinished":
      return {
        ...state,
        gameOver: true,
        endReason: action.payload.reason,
      };

    case "newSessionRequested":
    case "returnedToSetup":
      return {
        ...state,
        screen: "setup",
        gameOver: false,
        endReason: null,
        currentTask: null,
      };

    case "taskPrepared":
      return {
        ...state,
        currentTask: action.payload,
      };

    case "answerSubmitted": {
      const { userAnswer, correctAnswer, prompt, isCorrect, feedback } = action.payload;

      const historyItem = {
        id: state.progress.history.length > 0 ? state.progress.history[0].id + 1 : 1,
        prompt,
        userAnswer,
        correctAnswer,
        isCorrect,
      };

      const newHistory = [historyItem, ...state.progress.history].slice(0, MAX_HISTORY_ITEMS);

      let streak = state.progress.streak;
      let bestStreak = state.progress.bestStreak;

      if (isCorrect) {
        streak += 1;
        bestStreak = Math.max(bestStreak, streak);
      } else {
        streak = 0;
      }

      return {
        ...state,
        progress: {
          ...state.progress,
          correctCount: state.progress.correctCount + (isCorrect ? 1 : 0),
          wrongCount: state.progress.wrongCount + (isCorrect ? 0 : 1),
          streak,
          bestStreak,
          history: newHistory,
          lastFeedback: feedback || null,
          lastWasCorrect: isCorrect,
        },
      };
    }

    case "initFromConfig":
      return {
        ...getInitialState(),
        config: action.payload,
        screen: "setup",
      };

    case "stateReplaced":
      return action.payload;

    default:
      return state;
  }
}
