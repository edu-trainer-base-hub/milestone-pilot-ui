import React from "react";
import { useTranslation } from "react-i18next";
import { generateTask } from "../lib/task-generator";
import { getCheckDigitForPlace, roundHalfUpTo } from "../lib/rounding";
import { useAccurateTimer } from "./useAccurateTimer";
import { useBeeps } from "./useBeeps";
import { useLocaleNumberFormatter } from "./useLocaleNumberFormatter";
import { useRoundingTrainerAnalytics } from "./useRoundingTrainerAnalytics";
import { useRoundingTrainerCapabilities } from "./useRoundingTrainerCapabilities";
import { initialTrainerState, trainerReducer } from "../model/trainer.reducer";
import {
  selectAccuracy,
  selectIsInteractable,
  selectIsPlayInteractable,
  selectTimeLeft,
  selectTimerActive,
  selectTotalAnswered,
} from "../model/trainer.selectors";
import type { ConfigUpdate, HistoryItem, SessionConfig, SessionEndReason, TargetPlace } from "../model/trainer.types";

function buildSessionId(counter: number): string {
  return `rounding-trainer-session-${counter}`;
}

function applyConfigUpdate(config: SessionConfig, update: ConfigUpdate): SessionConfig {
  return {
    ...config,
    ...update,
    targets: update.targets
      ? {
          ...config.targets,
          ...update.targets,
        }
      : config.targets,
  };
}

function targetKeyFromPlace(place: TargetPlace): "tens" | "hundreds" | "thousands" {
  if (place === 10) return "tens";
  if (place === 100) return "hundreds";
  return "thousands";
}

function lowerKeyFromPlace(place: TargetPlace): "ones" | "tens" | "hundreds" {
  if (place === 10) return "ones";
  if (place === 100) return "tens";
  return "hundreds";
}

export function useRoundingTrainerController() {
  const [state, dispatch] = React.useReducer(trainerReducer, initialTrainerState);
  const { t } = useTranslation();
  const formatNumber = useLocaleNumberFormatter();
  const analytics = useRoundingTrainerAnalytics();
  const { capabilities } = useRoundingTrainerCapabilities();

  const isInteractable = selectIsInteractable(state);
  const isPlayInteractable = selectIsPlayInteractable(state);
  const timerActive = selectTimerActive(state);
  const totalAnswered = selectTotalAnswered(state);
  const accuracy = selectAccuracy(state);
  const { elapsedSec, reset: resetTimer } = useAccurateTimer(timerActive);
  const { beep, chord } = useBeeps(state.config.soundsEnabled);
  const timeLeft = selectTimeLeft(elapsedSec, state.config.timerMinutes);
  const hasTimer = state.config.timerMinutes > 0;

  const sessionCounterRef = React.useRef(0);
  const setupTrackedRef = React.useRef(false);
  const finishedTrackedForSessionRef = React.useRef<number | null>(null);

  const trackSessionFinished = React.useCallback(
    (reason: SessionEndReason, answeredCount: number, accuracyValue: number) => {
      const activeSession = sessionCounterRef.current;
      if (activeSession <= 0) return;
      if (finishedTrackedForSessionRef.current === activeSession) return;

      analytics.trackSessionFinished(buildSessionId(activeSession), reason, elapsedSec, answeredCount, accuracyValue);
      finishedTrackedForSessionRef.current = activeSession;
    },
    [analytics, elapsedSec]
  );

  const buildTargetLabel = React.useCallback(
    (place: TargetPlace): string => {
      return t(`roundT.expl.target.${targetKeyFromPlace(place)}`);
    },
    [t]
  );

  const buildExplanation = React.useCallback(
    (original: number, target: TargetPlace, correctRounded: number): string => {
      const check = getCheckDigitForPlace(original, target);
      const direction = check >= 5 ? "up" : "down";

      return t("roundT.expl.template", {
        target: t(`roundT.expl.target.${targetKeyFromPlace(target)}`),
        lower: t(`roundT.expl.lower.${lowerKeyFromPlace(target)}`),
        check,
        direction: t(`roundT.expl.dir.${direction}`),
        correct: formatNumber(correctRounded),
      });
    },
    [formatNumber, t]
  );

  const updateConfig = React.useCallback(
    (update: ConfigUpdate) => {
      if (!isInteractable) return;
      dispatch({ type: "configUpdated", payload: update });
    },
    [isInteractable]
  );

  const startGame = React.useCallback(() => {
    if (!isInteractable) return;

    if (!capabilities.canUseCoreFeature) {
      analytics.trackFeatureLockedViewed("rounding_core_feature", "setup_start");
      return;
    }

    const hasAnySelectedTarget =
      state.config.targets.tens || state.config.targets.hundreds || state.config.targets.thousands;
    const targetFix: ConfigUpdate = hasAnySelectedTarget
      ? {}
      : {
          targets: {
            tens: true,
            hundreds: true,
            thousands: true,
          },
        };

    if (targetFix.targets) {
      dispatch({ type: "configUpdated", payload: targetFix });
    }

    const activeConfig = applyConfigUpdate(state.config, targetFix);

    dispatch({ type: "sessionStarted" });
    resetTimer();

    dispatch({
      type: "taskPrepared",
      payload: generateTask(activeConfig, 0, 0),
    });

    sessionCounterRef.current += 1;
    finishedTrackedForSessionRef.current = null;
    analytics.trackSessionStarted(buildSessionId(sessionCounterRef.current), activeConfig);
  }, [analytics, capabilities.canUseCoreFeature, isInteractable, resetTimer, state.config]);

  const newSession = React.useCallback(() => {
    if (!isInteractable) return;

    dispatch({ type: "newSessionRequested" });
    resetTimer();

    dispatch({
      type: "taskPrepared",
      payload: generateTask(state.config, 0, 0),
    });

    sessionCounterRef.current += 1;
    finishedTrackedForSessionRef.current = null;
    analytics.trackSessionStarted(buildSessionId(sessionCounterRef.current), state.config);
  }, [analytics, isInteractable, resetTimer, state.config]);

  const backToSetup = React.useCallback(() => {
    if (!isInteractable) return;
    dispatch({ type: "returnedToSetup" });
    resetTimer();
  }, [isInteractable, resetTimer]);

  const submitAnswer = React.useCallback(
    (userOutput: number): boolean => {
      if (!isPlayInteractable || !state.currentTask) return false;

      const { original, target, taskId } = state.currentTask;
      const correctRounded = roundHalfUpTo(original, target);
      const isCorrect = userOutput === correctRounded;

      const item: HistoryItem = {
        original,
        target,
        user: userOutput,
        correctRounded,
        correct: isCorrect,
        explanation: buildExplanation(original, target, correctRounded),
      };

      const lastLine = `${formatNumber(original)} → ${buildTargetLabel(target)} = ${formatNumber(userOutput)}`;

      dispatch({
        type: "answerSubmitted",
        payload: {
          item,
          lastLine,
        },
      });

      const sessionId = buildSessionId(sessionCounterRef.current);
      analytics.trackAnswerSubmitted(sessionId, isCorrect, target, state.config.mode);

      if (isCorrect) {
        void beep(880, 100, 0.05);
      } else {
        void beep(220, 120, 0.05);
      }

      const nextTotalAnswered = totalAnswered + 1;
      const nextCorrectCount = state.progress.correctCount + (isCorrect ? 1 : 0);
      const nextAccuracy = nextTotalAnswered === 0 ? 0 : Math.round((nextCorrectCount / nextTotalAnswered) * 100);

      if (state.config.maxExercises > 0 && nextTotalAnswered >= state.config.maxExercises) {
        dispatch({ type: "sessionFinished", payload: { reason: "ex" } });
        void chord();
        trackSessionFinished("ex", nextTotalAnswered, nextAccuracy);
        return true;
      }

      dispatch({
        type: "taskPrepared",
        payload: generateTask(state.config, taskId, nextTotalAnswered),
      });

      return true;
    },
    [
      analytics,
      beep,
      buildExplanation,
      buildTargetLabel,
      chord,
      formatNumber,
      isPlayInteractable,
      state.currentTask,
      state.config,
      state.progress.correctCount,
      totalAnswered,
      trackSessionFinished,
    ]
  );

  React.useEffect(() => {
    analytics.trackMiniAppViewed();
  }, [analytics]);

  React.useEffect(() => {
    if (!setupTrackedRef.current) {
      setupTrackedRef.current = true;
      return;
    }
    analytics.trackSetupChanged(state.config);
  }, [analytics, state.config]);

  React.useEffect(() => {
    if (!timerActive || !hasTimer) return;
    if (elapsedSec < state.config.timerMinutes * 60) return;

    dispatch({ type: "sessionFinished", payload: { reason: "time" } });
    void chord();
    trackSessionFinished("time", totalAnswered, accuracy);
  }, [
    accuracy,
    chord,
    elapsedSec,
    hasTimer,
    state.config.timerMinutes,
    timerActive,
    totalAnswered,
    trackSessionFinished,
  ]);

  return {
    state,
    capabilities,
    accuracy,
    totalAnswered,
    elapsedSec,
    timeLeft,
    hasTimer,
    isInteractable,
    isPlayInteractable,
    actions: {
      updateConfig,
      startGame,
      newSession,
      backToSetup,
      submitAnswer,
      dispatch,
    },
  };
}
