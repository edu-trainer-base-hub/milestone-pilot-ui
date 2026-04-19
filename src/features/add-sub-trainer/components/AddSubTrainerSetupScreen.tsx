import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { OperationsCard } from "./Setup/OperationsCard";
import { SessionOptionsCard } from "./Setup/SessionOptionsCard";

export function AddSubTrainerSetupScreen({ controller }: { controller: any }) {
  const { t } = useTranslation();
  const tr = (key: string, vars?: any) => t(`addSubT.${key}`, vars) as string;

  return (
    <div className="bg-muted/50 backdrop-blur rounded-2xl shadow-lg p-5 sm:p-8 max-w-5xl mx-auto w-full mt-4 space-y-6">
      <p className="text-muted-foreground">{tr("setup.intro")}</p>

      <div className="grid gap-6 md:grid-cols-2">
        <OperationsCard controller={controller} />
        <SessionOptionsCard controller={controller} />
      </div>

      <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
        <Button onClick={controller.actions.startGame} className="w-full sm:w-auto" disabled={!controller.canStart}>
          {tr("start")}
        </Button>
        <Button asChild variant="outline" className="w-full sm:w-auto">
          <Link to="/" aria-label={t("multiT.menu") || undefined}>
            {t("multiT.menu")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
