import { Link } from "react-router";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ModeToggle } from "@/components/theme/mode-toggle.tsx";
import LanguageSelector, { LanguageSelectorMode } from "@/components/lang/LanguageSelector.tsx";

interface TrainerSettingsMenuProps {
  showPlayActions: boolean;
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

export function TrainerSettingsMenu({
  showPlayActions,
  onNewSession,
  onBackToSetup,
  showHistory,
  onToggleHistory,
  labels,
}: TrainerSettingsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={labels.menu || "Menu"} className="size-8">
          <Settings className="size-6" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center text-center">
              <span className="w-full">{labels.menu}</span>
            </div>
            <div className="flex items-center gap-2">
              <ModeToggle />
              <LanguageSelector mode={LanguageSelectorMode.ICON} />
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          {showPlayActions && (
            <>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <div className="flex items-center justify-between w-full">
                  <Label htmlFor="history-toggle" className="cursor-pointer">
                    {labels.showHistory}
                  </Label>
                  <Switch id="history-toggle" checked={showHistory} onCheckedChange={() => onToggleHistory()} />
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onNewSession()}>{labels.newSession}</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onBackToSetup()}>{labels.changeRange}</DropdownMenuItem>

              <DropdownMenuSeparator />
            </>
          )}
        </DropdownMenuGroup>

        <DropdownMenuItem asChild>
          <Link to="/">{labels.mainMenuLabel}</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
