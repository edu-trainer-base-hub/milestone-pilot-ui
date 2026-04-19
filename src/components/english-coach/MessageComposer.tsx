import React, { useCallback, useRef, useState } from "react";
import { SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import VoiceRecorderButton from "@/components/english-coach/VoiceRecorderButton";
import VoiceRecordingOverlay from "@/components/english-coach/VoiceRecordingOverlay";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { RecorderStatus } from "@/types/englishCoach";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface MessageComposerProps {
  onSendText: (text: string) => void;
  onSendVoice: (blob: Blob) => void;
  disabled?: boolean;
  className?: string;
}

const MessageComposer: React.FC<MessageComposerProps> = ({ onSendText, onSendVoice, disabled = false, className }) => {
  const { t } = useTranslation();
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    status: recorderStatus,
    startRecording,
    stopRecording,
    audioBlob,
    error: recorderError,
    clearRecording,
  } = useVoiceRecorder();

  // Auto-send voice when blob is ready
  React.useEffect(() => {
    if (audioBlob) {
      onSendVoice(audioBlob);
      clearRecording();
    }
  }, [audioBlob, onSendVoice, clearRecording]);

  const handleSendText = useCallback(() => {
    if (!text.trim() || disabled) return;
    onSendText(text.trim());
    setText("");
    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [text, disabled, onSendText]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendText();
      }
    },
    [handleSendText]
  );

  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    // Auto-resize
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, []);

  return (
    <div className={cn("border-t bg-background p-3", className)}>
      {recorderError && <p className="mb-2 text-xs text-destructive">{t(recorderError)}</p>}
      <VoiceRecordingOverlay isOpen={recorderStatus === RecorderStatus.RECORDING} onStop={stopRecording} />

      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder={t("englishCoach.composer.placeholder")}
          disabled={disabled}
          className="flex-1 resize-none rounded-lg border bg-muted/40 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring disabled:opacity-50"
          style={{ minHeight: 40, maxHeight: 160 }}
        />

        <VoiceRecorderButton
          status={recorderStatus}
          onStart={startRecording}
          onStop={stopRecording}
          disabled={disabled}
        />

        <Button
          variant="default"
          size="icon"
          onClick={handleSendText}
          disabled={disabled || !text.trim()}
          aria-label={t("englishCoach.composer.send")}
        >
          <SendHorizontal className="size-4" />
        </Button>
      </div>
    </div>
  );
};

export default MessageComposer;
