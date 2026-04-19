import React from "react";
import { MultiplicationTrainerHeader } from "./MultiplicationTrainerHeader";

interface MultiplicationTrainerShellProps {
  children: React.ReactNode;
  headerLabels: {
    menu: string;
    newSession: string;
    changeRange: string;
    showHistory: string;
    mainMenuLabel: string;
  };
  title: string;
  isPlayScreen: boolean;
  playStatsSnippet: string | null;
  onNewSession: () => void;
  onBackToSetup: () => void;
  showHistory: boolean;
  onToggleHistory: () => void;
}

export function MultiplicationTrainerShell({
  children,
  headerLabels,
  title,
  isPlayScreen,
  playStatsSnippet,
  onNewSession,
  onBackToSetup,
  showHistory,
  onToggleHistory,
}: MultiplicationTrainerShellProps) {
  return (
    <div className="min-h-dvh w-full bg-gradient-to-br bg-background flex flex-col p-2 sm:p-4 overflow-hidden">
      <div className="w-full h-full min-h-0 flex flex-col gap-3 sm:gap-4">
        <MultiplicationTrainerHeader
          title={title}
          isPlayScreen={isPlayScreen}
          playStatsSnippet={playStatsSnippet}
          onNewSession={onNewSession}
          onBackToSetup={onBackToSetup}
          showHistory={showHistory}
          onToggleHistory={onToggleHistory}
          labels={headerLabels}
        />
        {children}
      </div>
    </div>
  );
}
