import { Info, Play } from "lucide-react";
import { type LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { type ApiMenuItem } from "@/services/MenuApiClient";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface MenuCardProps {
  item: ApiMenuItem;
  Icon: LucideIcon;
}

export function MenuCard({ item, Icon }: MenuCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  return (
    <Card
      className={cn(
        "menu-card relative overflow-hidden transition-all duration-300 border-muted-foreground/15 bg-card/60 backdrop-blur-md h-full flex flex-col gap-1 py-2 sm:py-6",
        !isMobile &&
          "group hover:shadow-2xl dark:hover:shadow-primary/20 hover:-translate-y-1.5 active:scale-[0.98] active:bg-muted/30"
      )}
    >
      {/* Decorative background element - Desktop only */}
      {!isMobile && (
        <div className="menu-card__blob absolute -right-4 -top-4 size-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors duration-500" />
      )}

      <CardHeader className="p-4 pb-2 relative z-10">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "menu-card__icon-shell rounded-2xl bg-primary/10 p-2.5 shadow-inner shrink-0 transition-all duration-500",
              !isMobile && "group-hover:bg-primary/20 group-hover:rotate-6 group-hover:scale-110"
            )}
          >
            <Icon className="h-6 w-6 text-primary drop-shadow-sm" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-col gap-1">
              {item.badge && (
                <div className="flex justify-end">
                  <Badge
                    variant="secondary"
                    className={cn(
                      "menu-card__badge text-[10px] h-4.5 px-1.5 font-black uppercase tracking-wider shadow-sm transition-all duration-300",
                      !isMobile && "group-hover:bg-primary group-hover:text-primary-foreground"
                    )}
                  >
                    {item.badge}
                  </Badge>
                </div>
              )}
              <CardTitle
                className={cn(
                  "text-lg font-bold tracking-tight leading-snug transition-colors duration-300 break-words line-clamp-2",
                  !isMobile && "group-hover:text-primary"
                )}
              >
                {item.title}
              </CardTitle>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0 space-y-4 flex-1 flex flex-col justify-between relative z-10">
        <div className="space-y-3">
          <div className={cn("relative", !isMobile && "group/info")}>
            <p className="line-clamp-2 text-sm text-muted-foreground leading-relaxed pr-7 font-medium">
              {item.description}
            </p>

            {isMobile ? (
              <Sheet>
                <SheetTrigger asChild>
                  <button
                    className="menu-card__info-button absolute -right-1 -top-1 p-1.5 rounded-full text-primary/70 active:text-primary transition-colors duration-300"
                    onClick={(e) => e.stopPropagation()}
                    aria-label="Info"
                  >
                    <Info className="size-4" />
                  </button>
                </SheetTrigger>
                <SheetContent side="bottom" className="rounded-t-3xl pt-6 h-auto max-h-[85vh]">
                  <SheetHeader className="text-left space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-primary/10 p-2.5">
                        <Icon className="size-6 text-primary" />
                      </div>
                      <SheetTitle className="text-xl font-bold">{item.title}</SheetTitle>
                    </div>
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {item.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs bg-secondary px-2.5 py-1 rounded-md text-secondary-foreground font-medium"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <SheetDescription className="text-base text-foreground/80 leading-relaxed pt-2">
                      {item.description}
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-8 mb-4">
                    <Button
                      className="menu-card__sheet-play-button w-full h-11 text-base font-bold shadow-lg shadow-primary/20"
                      onClick={() => {
                        navigate(item.path);
                      }}
                    >
                      {t("menu.play", "Play Now")}
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      className="menu-card__info-button absolute -right-1 -top-1 p-1.5 rounded-full text-muted-foreground/50 transition-all duration-300 lg:opacity-0 lg:group-hover/info:opacity-100 hover:bg-primary/10 hover:text-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      aria-label="Info"
                    >
                      <Info className="size-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[280px] p-3 text-sm font-medium bg-popover text-popover-foreground border border-border shadow-xl backdrop-blur-sm">
                    <p className="leading-relaxed">{item.description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 min-h-[1.25rem]">
            {item.tags?.map((tag) => (
              <span
                key={tag}
                className={cn(
                  "menu-card__tag text-[10px] bg-primary/5 border border-primary/10 px-2.5 py-0.5 rounded-full text-primary/70 font-bold transition-colors cursor-default",
                  !isMobile && "hover:bg-primary/10"
                )}
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>

        <Button
          className={cn(
            "menu-card__play-button w-full mt-4 h-10 font-bold shadow-lg shadow-primary/10 flex items-center justify-center gap-2 rounded-xl transition-all duration-300",
            !isMobile && "group-hover:bg-primary group-hover:shadow-primary/25 group-hover:scale-[1.02] active:scale-95"
          )}
          onClick={(e) => {
            e.stopPropagation();
            navigate(item.path);
          }}
        >
          <div
            className={cn(
              "menu-card__play-icon flex items-center justify-center size-6 rounded-lg bg-primary-foreground/20 transition-colors",
              !isMobile && "group-hover:bg-primary-foreground/30"
            )}
          >
            <Play className="size-3.5 fill-current" />
          </div>
          {t("menu.play", "Play Now")}
        </Button>
      </CardContent>
    </Card>
  );
}
