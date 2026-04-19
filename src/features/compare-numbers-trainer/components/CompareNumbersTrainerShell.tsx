import React from "react";
import { CompareNumbersTrainerHeader } from "./CompareNumbersTrainerHeader";

interface CompareNumbersTrainerShellProps {
  children: React.ReactNode;
  isPlayScreen: boolean;
  playSummarySnippet: string | null;
  onNewSession: () => void;
  onBackToSetup: () => void;
  labels: {
    title: string | null;
    openMenuAria: string | null;
    menuLabel: string | null;
    newSession: string | null;
    changeSetup: string | null;
    toMenu: string | null;
  };
}

export function CompareNumbersTrainerShell({
  children,
  isPlayScreen,
  playSummarySnippet,
  onNewSession,
  onBackToSetup,
  labels,
}: CompareNumbersTrainerShellProps) {
  return (
    <div className="min-h-dvh w-full bg-gradient-to-br bg-background flex flex-col p-2 sm:p-4 overflow-hidden">
      <div className="w-full h-full min-h-0 flex flex-col gap-3 sm:gap-4">
        <CompareNumbersTrainerHeader
          isPlayScreen={isPlayScreen}
          playSummarySnippet={playSummarySnippet}
          onNewSession={onNewSession}
          onBackToSetup={onBackToSetup}
          labels={labels}
        />
        {children}
      </div>
    </div>
  );
}
