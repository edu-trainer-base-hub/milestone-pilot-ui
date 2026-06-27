import { memo, useEffect, useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface TimezoneSelectorProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

interface TimezoneOption {
  value: string;
  label: string;
  keywords: string[];
}

const FALLBACK_TIMEZONES = [
  "UTC",

  // United States
  "America/Los_Angeles",
  "America/Chicago",
  "America/New_York",

  // Europe
  "Europe/London",
  "Europe/Paris",
  "Europe/Kiev",
];

const timezoneLabelCache = new Map<string, string>();
let timezoneOptionsCache: TimezoneOption[] | null = null;

const getSupportedTimezones = (): string[] => {
  try {
    const intlWithSupportedValues = Intl as typeof Intl & {
      supportedValuesOf?: (key: "timeZone") => string[];
    };

    return intlWithSupportedValues.supportedValuesOf?.("timeZone") ?? FALLBACK_TIMEZONES;
  } catch {
    return FALLBACK_TIMEZONES;
  }
};

const getTimezoneOffsetLabel = (timezone: string): string => {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "shortOffset",
    }).formatToParts(new Date());

    return parts.find((part) => part.type === "timeZoneName")?.value ?? "";
  } catch {
    return "";
  }
};

export const getTimezoneDisplayLabel = (timezone: string): string => {
  if (!timezone) {
    return "";
  }

  const cachedLabel = timezoneLabelCache.get(timezone);

  if (cachedLabel) {
    return cachedLabel;
  }

  const offset = getTimezoneOffsetLabel(timezone);
  const label = offset ? `${timezone} (${offset})` : timezone;

  timezoneLabelCache.set(timezone, label);

  return label;
};

const getTimezoneOptions = (): TimezoneOption[] => {
  if (timezoneOptionsCache) {
    return timezoneOptionsCache;
  }

  timezoneOptionsCache = getSupportedTimezones().map((timezone) => {
    const label = getTimezoneDisplayLabel(timezone);

    return {
      value: timezone,
      label,
      keywords: [timezone, label],
    };
  });

  return timezoneOptionsCache;
};

const CurrentTimezoneTime = memo(({ timezone }: { timezone: string }) => {
  const { t } = useTranslation();
  const [currentTime, setCurrentTime] = useState("");

  const formatter = useMemo(() => {
    if (!timezone) {
      return null;
    }

    try {
      return new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZone: timezone,
        hour12: false,
      });
    } catch {
      return null;
    }
  }, [timezone]);

  useEffect(() => {
    if (!formatter) {
      setCurrentTime("");
      return;
    }

    const updateTime = () => {
      setCurrentTime(formatter.format(new Date()));
    };

    updateTime();

    const intervalId = window.setInterval(updateTime, 1000);

    return () => window.clearInterval(intervalId);
  }, [formatter]);

  if (!timezone || !currentTime) {
    return null;
  }

  return (
    <div className="text-sm text-muted-foreground">
      {t("tenants.dialog.currentTimeLabel")}: <span className="font-medium text-foreground">{currentTime}</span>
    </div>
  );
});

CurrentTimezoneTime.displayName = "CurrentTimezoneTime";

export const TimezoneSelector = memo(({ id, value, onChange, placeholder }: TimezoneSelectorProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const selectedLabel = useMemo(() => {
    return value ? getTimezoneDisplayLabel(value) : "";
  }, [value]);

  const timezoneOptions = useMemo(() => {
    return open ? getTimezoneOptions() : [];
  }, [open]);

  return (
    <div className="flex flex-col gap-2">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            id={id}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            {selectedLabel || placeholder || t("tenants.dialog.timezonePlaceholder")}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DialogTrigger>

        <DialogContent className="flex flex-col p-0 sm:max-w-[425px] overflow-hidden">
          <DialogHeader className="p-4 pb-2 text-left">
            <DialogTitle>{t("tenants.dialog.timezoneLabel")}</DialogTitle>
          </DialogHeader>

          {open && (
            <Command className="flex flex-col">
              <CommandInput placeholder={t("tenants.dialog.timezoneSearchPlaceholder")} />

              <CommandList className="max-h-[300px] overflow-y-auto">
                <CommandEmpty className="p-4 text-center text-sm">
                  {t("common.list.empty", "No results found.")}
                </CommandEmpty>

                <CommandGroup>
                  {timezoneOptions.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      keywords={option.keywords}
                      onSelect={() => {
                        onChange(option.value);
                        setOpen(false);
                      }}
                    >
                      <Check className={cn("mr-2 h-4 w-4", value === option.value ? "opacity-100" : "opacity-0")} />
                      {option.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          )}
        </DialogContent>
      </Dialog>

      <CurrentTimezoneTime timezone={value} />
    </div>
  );
});

TimezoneSelector.displayName = "TimezoneSelector";
