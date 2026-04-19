import React from "react";
import MessageList from "@/components/english-coach/MessageList";
import MessageComposer from "@/components/english-coach/MessageComposer";
import type { CoachSession } from "@/types/englishCoach";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useTranslation } from "react-i18next";

interface CoachChatLayoutProps {
  currentSession: CoachSession | null;
  chatStatus: string;
  onSendText: (text: string) => void;
  onSendVoice: (blob: Blob) => void;
  onRetryAssistant: () => void;
  onRetrySpeech: (messageUuid: string) => void;
  isAutoPlayEnabled: boolean;
  onToggleAutoPlay: () => void;
  isSessionFull?: boolean;
  isSessionsLimitReached?: boolean;
  sessionsLimitError?: string | null;
  sessionTokenUsage?: { used: number; limit: number; percentage: number } | null;
  className?: string;
}

const CoachChatLayout: React.FC<CoachChatLayoutProps> = ({
  currentSession,
  chatStatus,
  onSendText,
  onSendVoice,
  onRetryAssistant,
  onRetrySpeech,
  isAutoPlayEnabled,
  onToggleAutoPlay,
  isSessionFull = false,
  isSessionsLimitReached = false,
  sessionsLimitError = null,
  sessionTokenUsage = null,
  className,
}) => {
  const { t } = useTranslation();
  const isBusy = chatStatus !== "idle";

  return (
    <div className={cn("flex flex-col min-w-0 bg-background", className)}>
      {/* Header with autoplay toggle */}
      <div className="flex items-center justify-end px-4 py-2 border-b gap-2 bg-muted/20">
        <div className="flex items-center gap-2">
          <Switch id="autoplay-switch" checked={isAutoPlayEnabled} onCheckedChange={onToggleAutoPlay} />
          <Label htmlFor="autoplay-switch" className="text-xs text-muted-foreground font-medium cursor-pointer">
            {t("englishCoach.audio.autoplay")}
          </Label>
        </div>
      </div>

      <MessageList
        key={currentSession?.uuid ?? "empty"}
        messages={currentSession?.messages ?? []}
        chatStatus={chatStatus}
        onRetryAssistant={onRetryAssistant}
        onRetrySpeech={onRetrySpeech}
        onAddPracticeToChat={(instructions) => onSendText(instructions)}
        isAutoPlayEnabled={isAutoPlayEnabled}
        isLimitReached={isSessionFull}
      />

      {sessionsLimitError === "ENGLISH_COACH_SESSIONS_LIMIT_REACHED" && (
        <div className="bg-destructive text-destructive-foreground px-4 py-3 text-sm text-center font-semibold">
          {t("englishCoach.sessions.limitReached")}
        </div>
      )}

      {isSessionFull && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 text-sm text-center border-t border-destructive/20">
          {t(
            "englishCoach.session.limitReached",
            "Session limits reached (tokens or max messages). Please start a new conversation."
          )}
        </div>
      )}

      {!currentSession && isSessionsLimitReached && !sessionsLimitError && (
        <div className="bg-warning/10 text-warning-foreground px-4 py-3 text-sm text-center border-t border-warning/20">
          {t("englishCoach.sessions.limitReached")}
        </div>
      )}

      {sessionTokenUsage && currentSession && (
        <div className="px-4 py-3 gap-1.5 flex flex-col border-t bg-muted/10 shadow-[0_-4px_10px_rgba(0,0,0,0.02)] z-10">
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span className="font-semibold text-foreground/80">{t("englishCoach.session.usage")}</span>
            <span className="tabular-nums font-medium">
              {t("englishCoach.session.tokens", { total: sessionTokenUsage.used, limit: sessionTokenUsage.limit })}
              {` (${sessionTokenUsage.percentage}%)`}
            </span>
          </div>
          <div className="h-2 w-full bg-secondary rounded-full overflow-hidden shadow-inner flex">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500 ease-out",
                sessionTokenUsage.percentage > 90
                  ? "bg-destructive shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                  : sessionTokenUsage.percentage > 70
                    ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                    : "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
              )}
              style={{ width: `${sessionTokenUsage.percentage}%` }}
            />
          </div>
        </div>
      )}

      <MessageComposer
        onSendText={onSendText}
        onSendVoice={onSendVoice}
        disabled={isBusy || isSessionFull || (isSessionsLimitReached && !currentSession)}
      />
    </div>
  );
};

export default CoachChatLayout;
