import React from "react";
import { useTranslation } from "react-i18next";
import { QuizKeyboardPad } from "@/components/ui/quiz-keyboard-pad";
import { StatisticsBlock } from "@/components/ui/statistics-block";
import { TrainerPlayLayout } from "@/components/ui/trainer-play-layout";
import { cn } from "@/lib/utils";
import type { CompareRelation } from "@/lib/compare-numbers/generator";
import type { CompareNumbersSessionState, HistoryEntry, HistoryOrder } from "../model/trainer.types";
import { formatTime, relationLabel, resolveDisplaySizeClass } from "../lib/format";
import { CompareNumbersHistoryTable } from "./CompareNumbersHistoryTable";
import { NotificationBanner, type NotificationPayload } from "./shared/NotificationBanner";

interface CompareNumbersPlayScreenProps {
  session: CompareNumbersSessionState;
  historyDisplay: HistoryEntry[];
  historyOrder: HistoryOrder;
  maxExercises: number | null;
  elapsedSec: number;
  hasTimer: boolean;
  timeLeft: number | null;
  focusRef: React.RefObject<HTMLDivElement | null>;
  onAnswer: (relation: CompareRelation) => void;
}

export function CompareNumbersPlayScreen({
  session,
  historyDisplay,
  historyOrder,
  maxExercises,
  elapsedSec,
  hasTimer,
  timeLeft,
  focusRef,
  onAnswer,
}: CompareNumbersPlayScreenProps) {
  const { t } = useTranslation();
  const tr = React.useCallback((key: string, options?: Record<string, unknown>) => t(`cmpNmbrGm.${key}`, options), [t]);

  const totalExercises = session.history.length;
  const accuracy = totalExercises > 0 ? Math.round((session.correctCount / totalExercises) * 100) : 0;
  const sessionEnded = session.screen === "play" && session.gameOver;
  const displaySizeClass = React.useMemo(() => resolveDisplaySizeClass(session.exercise), [session.exercise]);

  const feedbackNotification = React.useMemo<NotificationPayload | null>(() => {
    if (!session.feedback) return null;
    if (session.feedback.type === "correct") {
      return {
        variant: "success",
        message: tr("feedback.correct"),
      };
    }
    return {
      variant: "error",
      message: tr("feedback.wrong", {
        user: relationLabel(session.feedback.userRelation, tr),
        correct: relationLabel(session.feedback.correctRelation, tr),
      }),
    };
  }, [session.feedback, tr]);

  const sessionNotification = React.useMemo<NotificationPayload | null>(() => {
    if (!sessionEnded || !session.endReason) {
      return null;
    }

    if (session.endReason === "time") {
      return {
        variant: "warning",
        message: tr("finished.time"),
      };
    }

    if (session.endReason === "ex") {
      return {
        variant: "info",
        message: tr("finished.exercises", {
          count: maxExercises ?? totalExercises,
        }),
      };
    }

    if (session.endReason === "generator") {
      return {
        variant: "warning",
        message: tr("finished.generator"),
      };
    }

    return null;
  }, [maxExercises, session.endReason, sessionEnded, totalExercises, tr]);

  const activeNotifications = React.useMemo(() => {
    if (sessionNotification) {
      return [sessionNotification];
    }

    return feedbackNotification ? [feedbackNotification] : [];
  }, [feedbackNotification, sessionNotification]);

  const relationOptions = React.useMemo(
    () => [
      { key: "less", value: "<" as const, label: "<", ariaLabel: relationLabel("<", tr) },
      { key: "equal", value: "=" as const, label: "=", ariaLabel: relationLabel("=", tr) },
      { key: "greater", value: ">" as const, label: ">", ariaLabel: relationLabel(">", tr) },
    ],
    [tr]
  );

  const statsItems = React.useMemo(() => {
    const baseItems = [
      { key: "correct", label: tr("stats.correct"), value: session.correctCount },
      { key: "wrong", label: tr("stats.wrong"), value: session.wrongCount },
      { key: "accuracy", label: tr("stats.accuracy"), value: `${accuracy}%` },
    ];

    if (hasTimer) {
      baseItems.push({
        key: "timeLeft",
        label: tr("stats.timeLeft"),
        value: formatTime(timeLeft ?? 0),
      });
      return baseItems;
    }

    baseItems.push({
      key: "time",
      label: tr("stats.time"),
      value: formatTime(elapsedSec),
    });

    return baseItems;
  }, [accuracy, elapsedSec, hasTimer, session.correctCount, session.wrongCount, timeLeft, tr]);

  return (
    <TrainerPlayLayout
      leftColumnRef={focusRef}
      leftColumnProps={{ tabIndex: -1 }}
      leftColumnClassName="outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-xl"
      stats={<StatisticsBlock items={statsItems} />}
      extra={
        activeNotifications.length > 0 ? (
          <div className="space-y-3">
            {activeNotifications.map((notification, index) => (
              <NotificationBanner key={`${notification.variant}-${index}`} variant={notification.variant}>
                {notification.message}
              </NotificationBanner>
            ))}
          </div>
        ) : null
      }
      main={
        <div className="rounded-2xl border bg-background/40 p-4 sm:p-5 lg:p-6 text-center shadow-sm">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{tr("play.compare")}</div>
          <div
            key={session.taskId}
            className={cn(
              "mt-4 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center justify-items-center gap-2 sm:gap-4",
              displaySizeClass
            )}
          >
            <span className="font-semibold whitespace-nowrap text-center leading-tight">
              {session.exercise?.left.display ?? ""}
            </span>
            <span className="font-semibold text-muted-foreground">?</span>
            <span className="font-semibold whitespace-nowrap text-center leading-tight">
              {session.exercise?.right.display ?? ""}
            </span>
          </div>

          <div className="mt-4 sm:mt-6 flex justify-center">
            <QuizKeyboardPad<CompareRelation>
              taskId={session.taskId}
              options={relationOptions}
              onSelect={onAnswer}
              disabled={sessionEnded}
              columns={3}
              hotkeysHint={tr("play.hotkeys")}
            />
          </div>
        </div>
      }
      history={
        <CompareNumbersHistoryTable
          history={session.history}
          historyDisplay={historyDisplay}
          historyOrder={historyOrder}
          tr={tr}
        />
      }
    />
  );
}
