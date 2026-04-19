import { TrainerSettingsMenu } from "./TrainerSettingsMenu";

interface MultiplicationTrainerHeaderProps {
  title: string;
  isPlayScreen: boolean;
  playStatsSnippet: string | null;
  onNewSession: () => void;
  onBackToSetup: () => void;
  showHistory: boolean;
  onToggleHistory: () => void;
  labels: {
    menu: string;
    newSession: string;
    changeRange: string;
    showHistory: string;
    mainMenuLabel: string;
  };
}

export function MultiplicationTrainerHeader({
  title,
  isPlayScreen,
  playStatsSnippet,
  onNewSession,
  onBackToSetup,
  showHistory,
  onToggleHistory,
  labels,
}: MultiplicationTrainerHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      {/* Left: Title */}
      <div className="flex items-center gap-2">
        <span className="hidden sm:inline text-xs text-muted-foreground">{title}</span>
      </div>

      <div className="flex items-center text-center">
        {isPlayScreen && playStatsSnippet && (
          <span className="w-full text-[10px] sm:text-xs text-muted-foreground">{playStatsSnippet}</span>
        )}
      </div>

      {/* Right: Settings menu */}
      <TrainerSettingsMenu
        showPlayActions={isPlayScreen}
        onNewSession={onNewSession}
        onBackToSetup={onBackToSetup}
        showHistory={showHistory}
        onToggleHistory={onToggleHistory}
        labels={labels}
      />
    </div>
  );
}
