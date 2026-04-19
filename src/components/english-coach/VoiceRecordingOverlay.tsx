import React from "react";
import { Mic, SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogOverlay } from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";

interface VoiceRecordingOverlayProps {
  isOpen: boolean;
  onStop: () => void;
}

const VoiceRecordingOverlay: React.FC<VoiceRecordingOverlayProps> = ({ isOpen, onStop }) => {
  const { t } = useTranslation();

  return (
    <Dialog open={isOpen}>
      <DialogOverlay className="bg-background/80 backdrop-blur-xl" />
      <DialogContent
        className="flex flex-col items-center justify-center border-none bg-transparent p-0 shadow-none sm:max-w-none [&>button]:hidden"
        showCloseButton={false}
      >
        <div className="flex flex-col items-center gap-16">
          {/* Pulsing Recording Animation */}
          <div className="relative flex items-center justify-center">
            <div className="absolute size-32 animate-ping rounded-full bg-primary/20" />
            <div className="absolute size-48 animate-pulse rounded-full bg-primary/10" />
            <div className="z-10 flex size-24 items-center justify-center rounded-full bg-background/50 shadow-2xl backdrop-blur-md">
              <Mic className="size-12 animate-pulse text-primary" />
            </div>
          </div>

          {/* Big Send Button */}
          <div className="flex flex-col items-center gap-6">
            <Button
              size="icon"
              variant="default"
              onClick={onStop}
              className="size-48 rounded-full bg-primary shadow-2xl transition-all hover:scale-105 active:scale-95"
            >
              <SendHorizontal className="size-20" />
            </Button>
            <p className="animate-bounce text-xl font-bold tracking-tight text-foreground">
              {t("englishCoach.voice.stopAndSend")}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VoiceRecordingOverlay;
