import type { CompareNumbersSessionAction, CompareNumbersSessionState } from "./trainer.types";
import { INITIAL_SESSION_STATE } from "./trainer.constants";

export function compareNumbersSessionReducer(
  state: CompareNumbersSessionState,
  action: CompareNumbersSessionAction
): CompareNumbersSessionState {
  switch (action.type) {
    case "sessionStarted": {
      const hasInitialExercise = Boolean(action.payload.exercise);
      return {
        ...state,
        screen: "play",
        correctCount: 0,
        wrongCount: 0,
        history: [],
        feedback: null,
        exercise: action.payload.exercise,
        gameOver: !hasInitialExercise,
        endReason: hasInitialExercise ? null : "generator",
        taskId: state.taskId + 1,
        sessionAnchor: state.sessionAnchor + 1,
      };
    }

    case "answerRegistered": {
      return {
        ...state,
        correctCount: action.payload.isCorrect ? state.correctCount + 1 : state.correctCount,
        wrongCount: action.payload.isCorrect ? state.wrongCount : state.wrongCount + 1,
        history: [...state.history, action.payload.entry],
        feedback: action.payload.feedback,
      };
    }

    case "exerciseAdvanced": {
      if (!action.payload.exercise) {
        return {
          ...state,
          exercise: null,
          gameOver: true,
          endReason: "generator",
        };
      }
      return {
        ...state,
        exercise: action.payload.exercise,
        taskId: state.taskId + 1,
      };
    }

    case "sessionFinished": {
      return {
        ...state,
        gameOver: true,
        endReason: action.payload.reason,
      };
    }

    case "returnedToSetup": {
      return {
        ...state,
        screen: "setup",
        gameOver: false,
        endReason: null,
        exercise: null,
        feedback: null,
      };
    }

    default:
      return state;
  }
}

export const initialCompareNumbersSessionState = INITIAL_SESSION_STATE;
