import React from "react";
import { initialTrainerState, trainerReducer } from "../model/trainer.reducer";
import { generateTask } from "../lib/task-generator";
import { useAccurateTimer } from "./useAccurateTimer";
import { useTrainerAnalytics } from "./useTrainerAnalytics";
import type { SessionConfig } from "../model/trainer.types";
import {
  selectAccuracy,
  selectTotalAnswered,
  selectShouldEndByExerciseCount,
  selectIsActive,
  selectIsInteractable,
  selectIsPlayInteractable,
} from "../model/trainer.selectors";

/**
 * Central orchestrator.
 * Connects the pure Reducer state with React side effects (Timers, Analytics).
 */
export function useMultiplicationTrainerController() {
  const [state, dispatch] = React.useReducer(trainerReducer, initialTrainerState);
  const analytics = useTrainerAnalytics();

  const isInteractable = selectIsInteractable(state);
  const isPlayInteractable = selectIsPlayInteractable(state);
  const isActive = selectIsActive(state);
  const timerActive = isActive && isPlayInteractable;

  const { elapsedSec, reset: resetTimer } = useAccurateTimer(timerActive);

  // Side effect: Time limit watcher
  React.useEffect(() => {
    if (!timerActive || state.config.timerMinutes <= 0) return;
    const limitSec = state.config.timerMinutes * 60;
    if (elapsedSec >= limitSec) {
      dispatch({ type: "sessionFinished", payload: { reason: "time" } });
      analytics.trackSessionFinished("time", elapsedSec, selectTotalAnswered(state), selectAccuracy(state));
    }
  }, [elapsedSec, timerActive, state.config.timerMinutes, state, analytics]);

  // Actions
  const updateConfig = React.useCallback(
    (updates: Partial<SessionConfig>) => {
      if (!isInteractable) return;
      dispatch({ type: "configUpdated", payload: updates });
    },
    [isInteractable]
  );

  const startGame = React.useCallback(() => {
    if (!isInteractable) return;
    const min = Math.min(state.config.minVal, state.config.maxVal);
    const max = Math.max(state.config.minVal, state.config.maxVal);
    const configFixes: Partial<SessionConfig> = { minVal: min, maxVal: max };
    if (!state.config.includeMul && !state.config.includeDiv) {
      configFixes.includeMul = true;
    }
    dispatch({ type: "configUpdated", payload: configFixes });
    dispatch({ type: "sessionStarted" });
    resetTimer();
    const activeConfig = { ...state.config, ...configFixes };
    dispatch({ type: "taskPrepared", payload: generateTask(activeConfig, 0) });
    analytics.trackSessionStarted(activeConfig);
  }, [state.config, isInteractable, resetTimer, analytics]);

  const submitAnswer = React.useCallback(
    (value: number) => {
      if (!isPlayInteractable || !state.currentTask) return;
      const wasCorrect = value === state.currentTask.correctAnswer;
      const op = state.currentTask.op;
      dispatch({ type: "answerSubmitted", payload: { userOutput: value } });
      analytics.trackAnswerSubmitted(wasCorrect, op);
    },
    [isPlayInteractable, state.currentTask, analytics]
  );

  // Pick next task or end session after each submitted answer
  const prevTotalAnsweredRef = React.useRef(0);
  const totalAnswered = selectTotalAnswered(state);

  React.useEffect(() => {
    if (!isPlayInteractable) return;
    if (totalAnswered <= prevTotalAnsweredRef.current) return;
    prevTotalAnsweredRef.current = totalAnswered;

    if (selectShouldEndByExerciseCount(state)) {
      dispatch({ type: "sessionFinished", payload: { reason: "ex" } });
      analytics.trackSessionFinished("ex", elapsedSec, totalAnswered, selectAccuracy(state));
    } else {
      dispatch({
        type: "taskPrepared",
        payload: generateTask(state.config, state.currentTask?.taskId ?? 0),
      });
    }
  }, [totalAnswered, isPlayInteractable, state, elapsedSec, analytics]);

  const newSession = React.useCallback(() => {
    if (!isInteractable) return;
    dispatch({ type: "newSessionRequested" });
    resetTimer();
    prevTotalAnsweredRef.current = 0;
    dispatch({ type: "taskPrepared", payload: generateTask(state.config, 0) });
    analytics.trackSessionStarted(state.config);
  }, [isInteractable, resetTimer, state.config, analytics]);

  const backToSetup = React.useCallback(() => {
    if (!isInteractable) return;
    dispatch({ type: "returnedToSetup" });
    resetTimer();
    prevTotalAnsweredRef.current = 0;
  }, [isInteractable, resetTimer]);

  const accuracy = selectAccuracy(state);

  return {
    state,
    accuracy,
    totalAnswered,
    elapsedSec,
    isInteractable,
    isPlayInteractable,
    actions: {
      updateConfig,
      startGame,
      submitAnswer,
      newSession,
      backToSetup,
      dispatch,
    },
  };
}
