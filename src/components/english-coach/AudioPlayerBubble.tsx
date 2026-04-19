import React, { useCallback, useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

interface AudioPlayerBubbleProps {
  audioUrl: string;
  autoPlay?: boolean;
  onRetry?: () => void;
}

const AudioPlayerBubble: React.FC<AudioPlayerBubbleProps> = ({ audioUrl, autoPlay = false, onRetry }) => {
  const { t } = useTranslation();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(() => {
        /* autoplay blocked */
      });
    }
  }, [isPlaying]);

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };
    const onTimeUpdate = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("timeupdate", onTimeUpdate);

    if (autoPlay) {
      audio.play().catch(() => {
        /* browser blocked autoplay */
      });
    }

    return () => {
      audio.pause();
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      // removing URL.revokeObjectURL(audioUrl) because it kills the URL
      // if the component unmounts/remounts (Strict Mode) while the parent still holds the ref.
    };
  }, [audioUrl, autoPlay]);

  return (
    <div className="flex items-center gap-2 mt-1">
      <Button
        variant="ghost"
        size="icon"
        className="size-7"
        onClick={togglePlay}
        aria-label={isPlaying ? t("englishCoach.audio.pause") : t("englishCoach.audio.play")}
      >
        {isPlaying ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
      </Button>

      {/* progress bar */}
      <div className="h-1 flex-1 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
      </div>

      {onRetry && (
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={onRetry}
          aria-label={t("englishCoach.audio.retry")}
        >
          <RotateCcw className="size-3.5" />
        </Button>
      )}
    </div>
  );
};

export default AudioPlayerBubble;
