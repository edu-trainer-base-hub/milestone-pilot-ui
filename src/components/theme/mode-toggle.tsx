import { ChevronDownIcon, Laptop, Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import { useTheme } from "@/components/theme/theme-provider.tsx";

export function ModeToggle({
  showText = false,
  triggerClassName,
  dropdownClassName,
}: {
  showText?: boolean;
  triggerClassName?: string;
  dropdownClassName?: string;
}) {
  const { theme, setTheme } = useTheme();

  const currentLabel = theme === "light" ? "Light" : theme === "dark" ? "Dark" : "System";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {showText ? (
          <Button variant="outline" className={`justify-between relative ${triggerClassName ?? ""}`}>
            <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
            <span className="font-normal">{currentLabel}</span>
            <ChevronDownIcon className="text-muted-foreground opacity-50" />
          </Button>
        ) : (
          <Button variant="outline" size="icon" className={triggerClassName}>
            <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className={dropdownClassName}>
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 h-4 w-4" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <Laptop className="mr-2 h-4 w-4" />
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
