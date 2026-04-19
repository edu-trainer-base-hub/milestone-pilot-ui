import { Link } from "react-router";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ModeToggle } from "@/components/theme/mode-toggle";
import LanguageSelector, { LanguageSelectorMode } from "@/components/lang/LanguageSelector";

interface CompareNumbersTrainerHeaderProps {
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

export function CompareNumbersTrainerHeader({
  isPlayScreen,
  playSummarySnippet,
  onNewSession,
  onBackToSetup,
  labels,
}: CompareNumbersTrainerHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <span className="hidden sm:inline text-xs text-muted-foreground">{labels.title}</span>
      </div>

      <div className="flex items-center text-center">
        {isPlayScreen && (
          <span className="w-full text-[10px] sm:text-xs text-muted-foreground">{playSummarySnippet}</span>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={labels.openMenuAria ?? undefined} className="size-8">
            <Settings className="size-6" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center text-center">
                <span className="w-full">{labels.menuLabel}</span>
              </div>
              <div className="flex items-center gap-2">
                <ModeToggle />
                <LanguageSelector mode={LanguageSelectorMode.ICON} />
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            {isPlayScreen && (
              <>
                <DropdownMenuItem onSelect={() => onNewSession()}>{labels.newSession}</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => onBackToSetup()}>{labels.changeSetup}</DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem asChild>
              <Link to="/">{labels.toMenu}</Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
