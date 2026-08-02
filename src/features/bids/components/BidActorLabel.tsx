import { useTranslation } from "react-i18next";
import type { BidActor } from "../model/types";

interface BidActorLabelProps {
  actor: BidActor | null | undefined;
  compact?: boolean;
}

export function BidActorLabel({ actor, compact = false }: BidActorLabelProps) {
  const { t } = useTranslation();
  if (!actor || actor.type === "UNKNOWN") {
    return <span>{t("bids.actors.unknown", "Unknown actor")}</span>;
  }
  if (actor.type === "SYSTEM") {
    return <span>{t("bids.actors.system", "System")}</span>;
  }
  const primary = actor.displayName || actor.email || t("bids.actors.deleted", "Former user");
  const secondary = actor.displayName ? actor.email : actor.userUuid;
  return (
    <span className={compact ? "inline" : "inline-flex flex-col"}>
      <span>{primary}</span>
      {secondary && secondary !== primary && (
        <span className={compact ? "ml-1 text-muted-foreground" : "text-xs text-muted-foreground"}>
          {compact ? `· ${secondary}` : secondary}
        </span>
      )}
    </span>
  );
}
