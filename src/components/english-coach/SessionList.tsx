import React, { useState } from "react";
import type { CoachSession } from "@/types/englishCoach";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Plus, Trash2, Pencil, Check, X, MessageSquare, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface SessionListProps {
  sessions: CoachSession[];
  currentSessionUuid: string | null;
  onSelect: (sessionUuid: string) => void;
  onCreate: (title?: string) => void;
  onDelete: (sessionUuid: string) => void;
  onRestore: (sessionUuid: string) => void;
  onRename: (sessionUuid: string, newTitle: string) => void;
  isSessionsLimitReached?: boolean;
  sessionsLimit?: number;
  className?: string;
}

const SessionList: React.FC<SessionListProps> = ({
  sessions,
  currentSessionUuid,
  onSelect,
  onCreate,
  onDelete,
  onRestore,
  onRename,
  isSessionsLimitReached,
  sessionsLimit,
  className,
}) => {
  const { t } = useTranslation();
  const [editingUuid, setEditingUuid] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const activeSessionsCount = sessions.filter((s) => !s.deleted).length;

  const handleStartEdit = (session: CoachSession) => {
    setEditingUuid(session.uuid);
    setEditTitle(session.title);
  };

  const handleConfirmEdit = () => {
    if (editingUuid && editTitle.trim()) {
      onRename(editingUuid, editTitle.trim());
    }
    setEditingUuid(null);
  };

  const handleCancelEdit = () => {
    setEditingUuid(null);
    setEditTitle("");
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString([], {
        month: "short",
        day: "numeric",
      });
    } catch {
      return "";
    }
  };

  const handleConfirmDelete = (uuid: string) => {
    if (window.confirm(t("englishCoach.sessions.confirmDelete", "Are you sure you want to delete this session?"))) {
      onDelete(uuid);
    }
  };

  const handleConfirmRestore = (uuid: string) => {
    if (window.confirm(t("englishCoach.sessions.confirmRestore", "Are you sure you want to restore this session?"))) {
      onRestore(uuid);
    }
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* header */}
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <h2 className="text-sm font-semibold">
          {t("englishCoach.sessions.title")}
          {sessionsLimit && sessionsLimit !== Infinity && (
            <span className="ml-1.5 text-xs text-muted-foreground font-normal">
              ({activeSessionsCount}/{sessionsLimit})
            </span>
          )}
        </h2>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => onCreate()}
              disabled={isSessionsLimitReached}
              aria-label={t("englishCoach.sessions.new")}
            >
              <Plus className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" align="end">
            {isSessionsLimitReached ? t("englishCoach.sessions.limitReached") : t("englishCoach.sessions.new")}
          </TooltipContent>
        </Tooltip>
      </div>

      {/* list */}
      <div className="flex-1 overflow-y-auto">
        {isSessionsLimitReached && (
          <div className="px-3 py-2 bg-warning/10 text-warning-foreground text-[10px] border-b border-warning/20">
            {t("englishCoach.sessions.limitReached")}
          </div>
        )}

        {sessions.length === 0 && (
          <p className="px-3 py-4 text-xs text-muted-foreground text-center">{t("englishCoach.sessions.empty")}</p>
        )}

        {sessions.map((session) => (
          <div
            key={session.uuid}
            onClick={() => {
              if (editingUuid !== session.uuid && !session.deleted) onSelect(session.uuid);
            }}
            className={cn(
              "group flex items-center gap-2 px-3 py-2 transition-colors border-b border-border/40",
              session.deleted ? "cursor-default" : "cursor-pointer hover:bg-muted/50",
              currentSessionUuid === session.uuid && "bg-muted"
            )}
          >
            <MessageSquare className="size-4 shrink-0 text-muted-foreground" />

            {editingUuid === session.uuid ? (
              <div className="flex-1 flex flex-col gap-2 py-1">
                <input
                  autoFocus
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleConfirmEdit();
                    if (e.key === "Escape") handleCancelEdit();
                  }}
                  className="w-full bg-transparent border-b text-sm outline-none px-1 py-0.5 focus:border-primary transition-colors"
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="flex items-center justify-end gap-1 px-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs gap-1.5 hover:bg-primary/10 text-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleConfirmEdit();
                    }}
                  >
                    <Check className="size-3.5" />
                    <span>{t("common.save", "Save")}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs gap-1.5 hover:bg-muted-foreground/10 text-muted-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCancelEdit();
                    }}
                  >
                    <X className="size-3.5" />
                    <span>{t("common.cancel", "Cancel")}</span>
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className={cn("flex-1 min-w-0", session.deleted && "opacity-60")}>
                  <p className={cn("text-sm truncate", session.deleted && "line-through text-muted-foreground")}>
                    {session.title}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatDate(session.updatedAt)} · {session.messages.length} {t("englishCoach.sessions.messages")}
                  </p>
                </div>

                {/* actions (visible on hover / current) */}
                <div className="hidden group-hover:flex items-center gap-0.5">
                  {!session.deleted ? (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartEdit(session);
                        }}
                        aria-label={t("englishCoach.sessions.rename")}
                      >
                        <Pencil className="size-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6 text-destructive hover:bg-destructive/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConfirmDelete(session.uuid);
                        }}
                        aria-label={t("englishCoach.sessions.delete")}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-6 text-primary hover:bg-primary/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleConfirmRestore(session.uuid);
                          }}
                          disabled={isSessionsLimitReached}
                          aria-label={t("englishCoach.sessions.restore", "Restore")}
                        >
                          <RotateCcw className="size-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        {isSessionsLimitReached
                          ? t("englishCoach.sessions.limitReached")
                          : t("englishCoach.sessions.restore")}
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SessionList;
