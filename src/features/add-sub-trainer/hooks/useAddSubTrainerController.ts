import { useCallback, useReducer } from "react";
import { useTranslation } from "react-i18next";
import { getInitialState, trainerReducer } from "../model/trainer.reducer";
import {
  selectAccuracy,
  selectTotalAnswered,
  selectIsInteractable,
  selectIsPlayInteractable,
  selectCanStart,
} from "../model/trainer.selectors";
import { generateTask } from "../lib/task-generator";
import type { SessionConfig } from "../model/trainer.types";
import { useTrainerAnalytics } from "./useTrainerAnalytics";

export function useAddSubTrainerController(forcedInitialState?: any) {
  const { t } = useTranslation();
  const tr = useCallback((key: string, vars?: Record<string, unknown>) => t(`addSubT.${key}`, vars), [t]);

  const [state, dispatch] = useReducer(trainerReducer, forcedInitialState || getInitialState());
  const { track } = useTrainerAnalytics();

  const accuracy = selectAccuracy(state);
  const totalAnswered = selectTotalAnswered(state);
  const isInteractable = selectIsInteractable(state);
  const isPlayInteractable = selectIsPlayInteractable(state);
  const canStart = selectCanStart(state);

  const updateConfig = useCallback(
    (payload: Partial<SessionConfig>) => {
      if (!isInteractable) return;
      dispatch({ type: "configUpdated", payload });
      track({ name: "add_sub_trainer_setup_changed", payload });
    },
    [isInteractable, track]
  );

  const startGame = useCallback(() => {
    if (!isInteractable || !canStart) return;
    dispatch({ type: "sessionStarted" });
    track({ name: "add_sub_trainer_session_started", payload: { config: state.config } });

    const newTask = generateTask(state.config, 0);
    dispatch({ type: "taskPrepared", payload: newTask });
  }, [canStart, isInteractable, state.config, track]);

  const finishGame = useCallback(
    (reason: "time" | "limit") => {
      if (!isInteractable) return;
      dispatch({ type: "sessionFinished", payload: { reason } });
      track({
        name: "add_sub_trainer_session_finished",
        payload: {
          reason,
          correctCount: state.progress.correctCount,
          wrongCount: state.progress.wrongCount,
          bestStreak: state.progress.bestStreak,
          durationSec: 0,
        },
      });
    },
    [isInteractable, state.progress, track]
  );

  const submitAnswer = useCallback(
    (userAnswer: string, correctAnswer: number, prompt: string, isCorrect: boolean) => {
      if (!isPlayInteractable) return;

      const feedback = isCorrect ? tr("play.feedback.correct") : tr("play.feedback.wrong", { correct: correctAnswer });

      dispatch({
        type: "answerSubmitted",
        payload: { userAnswer, correctAnswer, prompt, isCorrect, feedback },
      });

      track({
        name: "add_sub_trainer_answer_submitted",
        payload: {
          isCorrect,
          streak: isCorrect ? state.progress.streak + 1 : 0,
          op: state.currentTask?.op || "add",
          timeTakenSec: 0,
          prompt,
        },
      });

      if (state.config.enableSounds && "speechSynthesis" in window) {
        const text = isCorrect ? tr("play.sr.correct") : tr("play.sr.wrong");
        const utter = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utter);
      }

      const count = state.progress.correctCount + state.progress.wrongCount + 1;
      if (state.config.maxExercises > 0 && count >= state.config.maxExercises) {
        finishGame("limit");
      } else {
        const newTask = generateTask(state.config, state.currentTask?.taskId || 0);
        dispatch({ type: "taskPrepared", payload: newTask });
      }
    },
    [isPlayInteractable, tr, track, state.progress, state.currentTask, state.config, finishGame]
  );

  const newSession = useCallback(() => {
    if (!isInteractable) return;
    dispatch({ type: "newSessionRequested" });
  }, [isInteractable]);

  const backToSetup = useCallback(() => {
    if (!isInteractable) return;
    dispatch({ type: "returnedToSetup" });
  }, [isInteractable]);

  return {
    state,
    accuracy,
    totalAnswered,
    isInteractable,
    isPlayInteractable,
    canStart,
    actions: {
      updateConfig,
      startGame,
      submitAnswer,
      finishGame,
      newSession,
      backToSetup,
      dispatch,
    },
  };
}
