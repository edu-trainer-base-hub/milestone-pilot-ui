import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { MessageRole } from "@/types/englishCoach";
import type { CoachMessage, CoachFeedback, PracticeTask } from "@/types/englishCoach";
import AudioPlayerBubble from "@/components/english-coach/AudioPlayerBubble";
import { Button } from "@/components/ui/button";
import { RotateCcw, Mic, Keyboard, Sparkles, BookOpen, Volume2 } from "lucide-react";
import { useTranslation } from "react-i18next";

/* ───────── sub-components ───────── */

const FeedbackCard: React.FC<{ feedback: CoachFeedback }> = ({ feedback }) => {
  const { t } = useTranslation();
  return (
    <div className="mt-2 rounded-lg border bg-muted/30 p-3 text-xs space-y-1.5">
      <div className="flex items-center gap-1.5 font-semibold text-sm">
        <Sparkles className="size-3.5 text-yellow-500" />
        {t("englishCoach.feedback.title")} — {feedback.score}/10
      </div>
      {feedback.grammarNotes.length > 0 && (
        <div>
          <span className="font-medium">{t("englishCoach.feedback.grammar")}:</span> {feedback.grammarNotes.join("; ")}
        </div>
      )}
      {feedback.fluencyNotes.length > 0 && (
        <div>
          <span className="font-medium">{t("englishCoach.feedback.fluency")}:</span> {feedback.fluencyNotes.join("; ")}
        </div>
      )}
      {feedback.vocabularyNotes.length > 0 && (
        <div>
          <span className="font-medium">{t("englishCoach.feedback.vocabulary")}:</span>{" "}
          {feedback.vocabularyNotes.join("; ")}
        </div>
      )}
    </div>
  );
};

const PracticeCard: React.FC<{
  practice: PracticeTask;
  onAddToChat?: () => void;
  disabled?: boolean;
}> = ({ practice, onAddToChat, disabled = false }) => {
  const { t } = useTranslation();
  return (
    <div className="mt-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-950/30 p-3 text-xs space-y-1">
      <div className="flex items-center gap-1.5 font-semibold text-sm">
        <BookOpen className="size-3.5 text-blue-500" />
        {t("englishCoach.practice.title")}: {practice.title}
      </div>
      <p>{practice.instructions}</p>
      <span className="inline-block rounded px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-[10px] uppercase tracking-wider font-medium">
        {practice.difficulty}
      </span>
      {onAddToChat && (
        <Button variant="ghost" size="sm" className="mt-1 h-7 text-xs" onClick={onAddToChat} disabled={disabled}>
          {t("englishCoach.practice.addToChat")}
        </Button>
      )}
    </div>
  );
};

/* ───────── MessageList ───────── */

interface MessageListProps {
  messages: CoachMessage[];
  chatStatus: string;
  onRetryAssistant?: () => void;
  onRetrySpeech?: (messageUuid: string) => void;
  onAddPracticeToChat?: (instructions: string) => void;
  isAutoPlayEnabled?: boolean;
  isLimitReached?: boolean;
  className?: string;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  chatStatus,
  onRetryAssistant,
  onRetrySpeech,
  onAddPracticeToChat,
  isAutoPlayEnabled = false,
  isLimitReached = false,
  className,
}) => {
  const { t } = useTranslation();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [manualAutoPlay, setManualAutoPlay] = React.useState<Set<string>>(new Set());
  const [loadingUuid, setLoadingUuid] = React.useState<string | null>(null);

  const initialAudioUrlsRef = useRef<Set<string>>(new Set(messages.filter((m) => !!m.audioUrl).map((m) => m.uuid)));

  const handlePlayVoice = (messageUuid: string) => {
    setLoadingUuid(messageUuid);
    setManualAutoPlay((prev) => new Set(prev).add(messageUuid));
    if (onRetrySpeech) onRetrySpeech(messageUuid);
  };

  // Clear loading state when audioUrl arrives for the message
  useEffect(() => {
    if (loadingUuid) {
      const msg = messages.find((m) => m.uuid === loadingUuid);
      if (msg?.audioUrl || chatStatus === "idle") {
        setLoadingUuid(null);
      }
    }
  }, [messages, loadingUuid, chatStatus]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, chatStatus]);

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  return (
    <div className={cn("flex-1 overflow-y-auto px-4 py-4 space-y-4", className)}>
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm gap-2">
          <Sparkles className="size-8 opacity-40" />
          <p>{t("englishCoach.emptyChat")}</p>
        </div>
      )}

      {messages.map((msg, index) => {
        const isUser = msg.role === MessageRole.USER;
        const isLastMessage = index === messages.length - 1;
        const isLoading = loadingUuid === msg.uuid;

        return (
          <div
            key={msg.uuid}
            className={cn(
              "flex flex-col max-w-[85%] sm:max-w-[75%]",
              isUser ? "ml-auto items-end" : "mr-auto items-start"
            )}
          >
            {/* role + time */}
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-0.5">
              {isUser && msg.inputMode === "voice" && <Mic className="size-3" />}
              {isUser && msg.inputMode === "text" && <Keyboard className="size-3" />}
              <span>{isUser ? t("englishCoach.message.you") : t("englishCoach.message.coach")}</span>
              <span>·</span>
              <span>{formatTime(msg.createdAt)}</span>
            </div>

            {/* bubble */}
            <div
              className={cn(
                "rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
                isUser ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted rounded-bl-md"
              )}
            >
              {msg.text}
            </div>

            {/* audio player for assistant */}
            {!isUser && msg.audioUrl && (
              <AudioPlayerBubble
                audioUrl={msg.audioUrl}
                autoPlay={
                  (isAutoPlayEnabled && isLastMessage && !initialAudioUrlsRef.current.has(msg.uuid)) ||
                  manualAutoPlay.has(msg.uuid)
                }
                onRetry={() => handlePlayVoice(msg.uuid)}
              />
            )}

            {/* audio retry if no audio url on assistant */}
            {!isUser && !msg.audioUrl && onRetrySpeech && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-1 h-7 text-xs gap-1 text-muted-foreground"
                onClick={() => handlePlayVoice(msg.uuid)}
                disabled={isLoading}
              >
                <Volume2 className={cn("size-3", isLoading && "animate-pulse")} />
                {isLoading ? t("englishCoach.audio.loading") : t("englishCoach.audio.playVoice")}
              </Button>
            )}

            {/* feedback */}
            {msg.feedback && <FeedbackCard feedback={msg.feedback} />}

            {/* next practice */}
            {isLastMessage && msg.nextPractice && (
              <PracticeCard
                practice={msg.nextPractice}
                onAddToChat={
                  onAddPracticeToChat ? () => onAddPracticeToChat(msg.nextPractice!.instructions) : undefined
                }
                disabled={isLimitReached}
              />
            )}
          </div>
        );
      })}

      {/* status indicators */}
      {chatStatus !== "idle" && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse">
          <div className="size-2 rounded-full bg-primary animate-bounce" />
          {chatStatus === "transcribing" && t("englishCoach.status.transcribing")}
          {chatStatus === "thinking" && t("englishCoach.status.thinking")}
          {chatStatus === "speaking" && t("englishCoach.status.speaking")}
        </div>
      )}

      {/* retry last assistant on error */}
      {chatStatus === "idle" &&
        messages.length > 0 &&
        messages[messages.length - 1].role === MessageRole.USER &&
        onRetryAssistant && (
          <Button
            variant="outline"
            size="sm"
            className="text-xs gap-1"
            onClick={onRetryAssistant}
            disabled={isLimitReached}
          >
            <RotateCcw className="size-3" />
            {t("englishCoach.retry")}
          </Button>
        )}

      <div ref={bottomRef} />
    </div>
  );
};

export default MessageList;
