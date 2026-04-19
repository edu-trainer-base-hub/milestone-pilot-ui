import React from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RecorderStatus } from "@/types/englishCoach";
import { useTranslation } from "react-i18next";

interface VoiceRecorderButtonProps {
  status: RecorderStatus;
  onStart: () => void;
  onStop: () => void;
  disabled?: boolean;
  className?: string;
}

const VoiceRecorderButton: React.FC<VoiceRecorderButtonProps> = ({
  status,
  onStart,
  onStop,
  disabled = false,
  className,
}) => {
  const { t } = useTranslation();

  const isRecording = status === RecorderStatus.RECORDING;
  const isProcessing = status === RecorderStatus.PROCESSING;

  const handleClick = () => {
    if (isRecording) {
      onStop();
    } else if (status === RecorderStatus.IDLE) {
      onStart();
    }
  };

  return (
    <Button
      type="button"
      variant={isRecording ? "destructive" : "outline"}
      size="icon"
      className={cn("relative shrink-0 transition-all", isRecording && "animate-pulse", className)}
      onClick={handleClick}
      disabled={disabled || isProcessing}
      aria-label={isRecording ? t("englishCoach.voice.stopRecording") : t("englishCoach.voice.startRecording")}
    >
      {isProcessing ? (
        <Loader2 className="size-4 animate-spin" />
      ) : isRecording ? (
        <Square className="size-4" />
      ) : (
        <Mic className="size-4" />
      )}
    </Button>
  );
};

export default VoiceRecorderButton;
