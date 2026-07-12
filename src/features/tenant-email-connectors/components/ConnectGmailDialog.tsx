import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Mail, MailPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GmailScopeMode } from "../model/types";

interface ConnectGmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (scopeMode: GmailScopeMode) => Promise<void>;
  loading: boolean;
}

export const ConnectGmailDialog: React.FC<ConnectGmailDialogProps> = ({ open, onOpenChange, onConnect, loading }) => {
  const { t } = useTranslation();
  const [scopeMode, setScopeMode] = useState<GmailScopeMode>(GmailScopeMode.GMAIL_READONLY);

  const options: { value: GmailScopeMode; icon: React.ReactNode; title: string; description: string }[] = [
    {
      value: GmailScopeMode.GMAIL_READONLY,
      icon: <Mail className="h-5 w-5" />,
      title: t("tenantIntegrations.connectDialog.readonlyTitle"),
      description: t("tenantIntegrations.connectDialog.readonlyDescription"),
    },
    {
      value: GmailScopeMode.GMAIL_MODIFY,
      icon: <MailPlus className="h-5 w-5" />,
      title: t("tenantIntegrations.connectDialog.modifyTitle"),
      description: t("tenantIntegrations.connectDialog.modifyDescription"),
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("tenantIntegrations.connectDialog.title")}</DialogTitle>
          <DialogDescription>{t("tenantIntegrations.connectDialog.description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setScopeMode(option.value)}
              className={`w-full flex items-start gap-3 rounded-md border p-4 text-left transition-colors ${
                scopeMode === option.value ? "border-primary bg-accent" : "hover:bg-accent/50"
              }`}
            >
              <div className="mt-0.5">{option.icon}</div>
              <div>
                <div className="font-medium">{option.title}</div>
                <div className="text-sm text-muted-foreground">{option.description}</div>
              </div>
            </button>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            {t("common.cancel")}
          </Button>
          <Button onClick={() => void onConnect(scopeMode)} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("tenantIntegrations.connectDialog.connect")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
