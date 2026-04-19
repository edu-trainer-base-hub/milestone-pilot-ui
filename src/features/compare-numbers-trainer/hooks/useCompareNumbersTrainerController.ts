import React from "react";
import {
  canGenerate,
  generateExercise,
  prepareGenerator,
  type CompareRelation,
  type DecimalTypeConfig,
  type FractionTypeConfig,
  type IntegerTypeConfig,
  type PreparedGenerator,
} from "@/lib/compare-numbers/generator";
import type { HistoryOrder, SessionEndReason, CompareNumbersSetupState } from "../model/trainer.types";
import { DEFAULT_SETUP_STATE } from "../model/trainer.constants";
import { compareNumbersSessionReducer, initialCompareNumbersSessionState } from "../model/trainer.reducer";
import {
  selectAccuracy,
  selectEqualRatioFraction,
  selectExercisesLimit,
  selectHistoryDisplay,
  selectTimeLeft,
  selectTimerLimitMinutes,
  selectTotalExercises,
  selectTypeAvailabilityMap,
} from "../model/trainer.selectors";
import {
  sanitizeAccordionMode,
  sanitizeDecimalConfig,
  sanitizeFractionConfig,
  sanitizeNonNegativeConfig,
  sanitizeSignedConfig,
} from "../lib/config-sanitizers";
import { useAccurateTimer } from "./useAccurateTimer";
import { useCompareNumbersAnalytics } from "./useCompareNumbersAnalytics";
import { useCompareNumbersCapabilities } from "./useCompareNumbersCapabilities";

function buildSessionId(sessionCounter: number): string {
  return `compare-numbers-session-${sessionCounter}`;
}

export function useCompareNumbersTrainerController() {
  const [setup, setSetup] = React.useState<CompareNumbersSetupState>(DEFAULT_SETUP_STATE);
  const [session, dispatch] = React.useReducer(compareNumbersSessionReducer, initialCompareNumbersSessionState);

  const analytics = useCompareNumbersAnalytics();
  const { capabilities } = useCompareNumbersCapabilities();

  const activeGeneratorRef = React.useRef<PreparedGenerator | null>(null);
  const historyIdRef = React.useRef(0);
  const audioCtxRef = React.useRef<AudioContext | null>(null);
  const setupTrackedRef = React.useRef(false);
  const sessionCounterRef = React.useRef(0);
  const finishedTrackedForSessionRef = React.useRef<number | null>(null);

  const equalRatioFraction = selectEqualRatioFraction(setup);

  const generatorPreview = React.useMemo(
    () =>
      prepareGenerator({
        nonNegativeInt: setup.nonNegativeConfig,
        signedInt: setup.signedConfig,
        decimal: setup.decimalConfig,
        fraction: setup.fractionConfig,
        equalRatio: equalRatioFraction,
      }),
    [setup.nonNegativeConfig, setup.signedConfig, setup.decimalConfig, setup.fractionConfig, equalRatioFraction]
  );

  const canStart = canGenerate(generatorPreview);
  const typeAvailableMap = React.useMemo(() => selectTypeAvailabilityMap(generatorPreview), [generatorPreview]);
  const exercisesLimit = selectExercisesLimit(setup);
  const timerLimitMinutes = selectTimerLimitMinutes(setup);
  const hasTimer = timerLimitMinutes !== null;
  const timerActive = session.screen === "play" && !session.gameOver;

  const { elapsedSec, reset: resetTimer } = useAccurateTimer(timerActive);

  const totalExercises = selectTotalExercises(session);
  const accuracy = selectAccuracy(session);
  const timeLeft = selectTimeLeft(elapsedSec, timerLimitMinutes);

  const historyDisplay = React.useMemo(
    () => selectHistoryDisplay(session.history, setup.historyOrder),
    [session.history, setup.historyOrder]
  );

  const trackSessionFinished = React.useCallback(
    (reason: SessionEndReason, answeredCount: number, accuracyValue: number) => {
      const currentSession = sessionCounterRef.current;
      if (currentSession <= 0) return;
      if (finishedTrackedForSessionRef.current === currentSession) return;

      analytics.trackSessionFinished(buildSessionId(currentSession), reason, elapsedSec, answeredCount, accuracyValue);
      finishedTrackedForSessionRef.current = currentSession;
    },
    [analytics, elapsedSec]
  );

  const beginSession = React.useCallback(
    (prepared: PreparedGenerator) => {
      activeGeneratorRef.current = prepared;
      resetTimer();

      const firstExercise = generateExercise(prepared);
      dispatch({ type: "sessionStarted", payload: { exercise: firstExercise } });

      sessionCounterRef.current += 1;
      finishedTrackedForSessionRef.current = null;
      analytics.trackSessionStarted(buildSessionId(sessionCounterRef.current), setup);

      if (!firstExercise) {
        trackSessionFinished("generator", 0, 0);
      }
    },
    [analytics, resetTimer, setup, trackSessionFinished]
  );

  const triggerFeedback = React.useCallback(
    (isCorrect: boolean) => {
      if (setup.enableVibration && typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(isCorrect ? 25 : [10, 60, 10]);
      }

      if (!setup.enableSound) return;

      try {
        const AudioContextCtor =
          (globalThis as { AudioContext?: typeof AudioContext }).AudioContext ??
          (globalThis as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextCtor) return;

        if (!audioCtxRef.current) {
          audioCtxRef.current = new AudioContextCtor();
        }

        const ctx = audioCtxRef.current;
        if (ctx.state === "suspended") {
          void ctx.resume();
        }

        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        oscillator.type = "sine";
        oscillator.frequency.value = isCorrect ? 880 : 220;
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
        oscillator.connect(gain);
        gain.connect(ctx.destination);
        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.25);
      } catch (error) {
        console.error("Audio feedback error", error);
      }
    },
    [setup.enableSound, setup.enableVibration]
  );

  const setOpenMode = React.useCallback((value: string | undefined) => {
    setSetup((previous) => ({
      ...previous,
      openMode: sanitizeAccordionMode(value),
    }));
  }, []);

  const updateNonNegativeConfig = React.useCallback((update: Partial<IntegerTypeConfig>) => {
    setSetup((previous) => ({
      ...previous,
      nonNegativeConfig: sanitizeNonNegativeConfig(previous.nonNegativeConfig, update),
    }));
  }, []);

  const updateSignedConfig = React.useCallback((update: Partial<IntegerTypeConfig>) => {
    setSetup((previous) => ({
      ...previous,
      signedConfig: sanitizeSignedConfig(previous.signedConfig, update),
    }));
  }, []);

  const updateDecimalConfig = React.useCallback((update: Partial<DecimalTypeConfig>) => {
    setSetup((previous) => ({
      ...previous,
      decimalConfig: sanitizeDecimalConfig(previous.decimalConfig, update),
    }));
  }, []);

  const updateFractionConfig = React.useCallback((update: Partial<FractionTypeConfig>) => {
    setSetup((previous) => ({
      ...previous,
      fractionConfig: sanitizeFractionConfig(previous.fractionConfig, update),
    }));
  }, []);

  const setEqualRatio = React.useCallback((value: number) => {
    setSetup((previous) => ({
      ...previous,
      equalRatio: Math.max(0, Math.min(50, value)),
    }));
  }, []);

  const setTimerMinutes = React.useCallback((value: number | null) => {
    setSetup((previous) => ({
      ...previous,
      timerMinutes: value,
    }));
  }, []);

  const setMaxExercises = React.useCallback((value: number | null) => {
    setSetup((previous) => ({
      ...previous,
      maxExercises: value,
    }));
  }, []);

  const setHistoryOrder = React.useCallback((value: HistoryOrder) => {
    setSetup((previous) => ({
      ...previous,
      historyOrder: value,
    }));
  }, []);

  const setEnableSound = React.useCallback((value: boolean) => {
    setSetup((previous) => ({
      ...previous,
      enableSound: value,
    }));
  }, []);

  const setEnableVibration = React.useCallback((value: boolean) => {
    setSetup((previous) => ({
      ...previous,
      enableVibration: value,
    }));
  }, []);

  const startSession = React.useCallback(() => {
    if (!capabilities.canUseCoreFeature) {
      analytics.trackFeatureLockedViewed("compare_numbers_core_feature", "setup_start");
      return;
    }
    if (!canStart) return;

    const prepared = prepareGenerator({
      nonNegativeInt: setup.nonNegativeConfig,
      signedInt: setup.signedConfig,
      decimal: setup.decimalConfig,
      fraction: setup.fractionConfig,
      equalRatio: equalRatioFraction,
    });

    if (!canGenerate(prepared)) {
      return;
    }

    beginSession(prepared);
  }, [analytics, beginSession, canStart, capabilities.canUseCoreFeature, setup, equalRatioFraction]);

  const newSession = React.useCallback(() => {
    if (session.screen === "setup" || !activeGeneratorRef.current) {
      startSession();
      return;
    }
    beginSession(activeGeneratorRef.current);
  }, [beginSession, session.screen, startSession]);

  const backToSetup = React.useCallback(() => {
    dispatch({ type: "returnedToSetup" });
    resetTimer();
  }, [resetTimer]);

  const submitAnswer = React.useCallback(
    (relation: CompareRelation) => {
      if (session.screen !== "play" || session.gameOver || !session.exercise) return;

      const isCorrect = relation === session.exercise.correctRelation;
      historyIdRef.current += 1;

      const entry = {
        id: historyIdRef.current,
        left: session.exercise.left,
        right: session.exercise.right,
        correctRelation: session.exercise.correctRelation,
        userRelation: relation,
        isCorrect,
        timestamp: Date.now(),
      };

      dispatch({
        type: "answerRegistered",
        payload: {
          entry,
          feedback: {
            type: isCorrect ? "correct" : "wrong",
            userRelation: relation,
            correctRelation: session.exercise.correctRelation,
          },
          isCorrect,
        },
      });

      triggerFeedback(isCorrect);
      analytics.trackAnswerSubmitted(
        buildSessionId(sessionCounterRef.current),
        isCorrect,
        relation,
        session.exercise.correctRelation
      );

      const nextCorrect = session.correctCount + (isCorrect ? 1 : 0);
      const nextTotal = session.history.length + 1;
      const nextAccuracy = nextTotal > 0 ? Math.round((nextCorrect / nextTotal) * 100) : 0;

      if (exercisesLimit !== null && nextTotal >= exercisesLimit) {
        dispatch({ type: "sessionFinished", payload: { reason: "ex" } });
        trackSessionFinished("ex", nextTotal, nextAccuracy);
        return;
      }

      const generator = activeGeneratorRef.current ?? generatorPreview;
      const nextExercise = generateExercise(generator);
      dispatch({ type: "exerciseAdvanced", payload: { exercise: nextExercise } });

      if (!nextExercise) {
        trackSessionFinished("generator", nextTotal, nextAccuracy);
      }
    },
    [analytics, exercisesLimit, generatorPreview, session, trackSessionFinished, triggerFeedback]
  );

  React.useEffect(() => {
    analytics.trackMiniAppViewed();
  }, [analytics]);

  React.useEffect(() => {
    if (!setupTrackedRef.current) {
      setupTrackedRef.current = true;
      return;
    }
    analytics.trackSetupChanged(setup);
  }, [analytics, setup]);

  React.useEffect(() => {
    if (!timerActive || !hasTimer || timerLimitMinutes === null) return;
    if (elapsedSec < timerLimitMinutes * 60) return;
    dispatch({ type: "sessionFinished", payload: { reason: "time" } });
    trackSessionFinished("time", totalExercises, accuracy);
  }, [accuracy, elapsedSec, hasTimer, timerActive, timerLimitMinutes, totalExercises, trackSessionFinished]);

  React.useEffect(() => {
    if (!timerActive) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === "ArrowLeft") {
        event.preventDefault();
        submitAnswer("<");
      } else if (event.code === "ArrowRight") {
        event.preventDefault();
        submitAnswer(">");
      } else if (event.code === "Space") {
        event.preventDefault();
        submitAnswer("=");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [submitAnswer, timerActive]);

  React.useEffect(() => {
    return () => {
      const context = audioCtxRef.current;
      if (!context) return;
      void context.close().catch(() => undefined);
    };
  }, []);

  return {
    setup,
    session,
    capabilities,
    canStart,
    hasTimer,
    elapsedSec,
    timeLeft,
    totalExercises,
    accuracy,
    exercisesLimit,
    historyDisplay,
    typeAvailableMap,
    actions: {
      setOpenMode,
      updateNonNegativeConfig,
      updateSignedConfig,
      updateDecimalConfig,
      updateFractionConfig,
      setEqualRatio,
      setTimerMinutes,
      setMaxExercises,
      setHistoryOrder,
      setEnableSound,
      setEnableVibration,
      startSession,
      newSession,
      backToSetup,
      submitAnswer,
    },
  };
}
