import React, { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { notifier } from "@/services/NotificationService";
import {
  deleteEmailConnector,
  disableEmailConnector,
  getEmailConnectors,
  setDefaultEmailConnector,
  startGmailConnect,
} from "../api/emailConnectors";
import { canManageEmailConnectors, canReadEmailConnectors } from "../model/access-policy";
import type { EmailConnectorResponse, GmailScopeMode } from "../model/types";
import { ConnectGmailDialog } from "../components/ConnectGmailDialog";
import { ConnectorsTable } from "../components/ConnectorsTable";

export const EmailIntegrationsPage: React.FC = () => {
  const { t } = useTranslation();
  const { principal } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);

  const tenantId = principal?.activeTenantUuid ?? null;
  const authorities = principal?.authorities ?? [];
  const canRead = canReadEmailConnectors(authorities);
  const canManage = canManageEmailConnectors(authorities);

  const queryKey = ["emailConnectors", tenantId];

  const {
    data: connectors = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey,
    queryFn: getEmailConnectors,
    enabled: !!tenantId && canRead,
  });

  // Handle the query params set by the backend OAuth callback redirect.
  useEffect(() => {
    const connected = searchParams.get("connected");
    const error = searchParams.get("error");
    if (!connected && !error) {
      return;
    }
    if (connected === "true") {
      notifier.success(t("tenantIntegrations.notifications.connectSuccess"));
    } else if (error) {
      notifier.error(t(`errors.codes.${error}`, { defaultValue: t("errors.codes.UNKNOWN") }));
    }
    setSearchParams({}, { replace: true });
    void queryClient.invalidateQueries({ queryKey: ["emailConnectors"] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const connectMutation = useMutation({
    mutationFn: (scopeMode: GmailScopeMode) =>
      startGmailConnect({
        scopeMode,
        redirectAfterConnect: `${window.location.origin}/tenant/integrations/email`,
      }),
    onSuccess: (response) => {
      window.location.assign(response.authorizationUrl);
    },
    onError: () => {
      notifier.error(t("tenantIntegrations.notifications.connectError"));
    },
  });

  const actionMutation = useMutation({
    mutationFn: async ({
      action,
      connector,
    }: {
      action: "setDefault" | "disable" | "delete";
      connector: EmailConnectorResponse;
    }) => {
      if (action === "setDefault") {
        await setDefaultEmailConnector(connector.uuid);
      } else if (action === "disable") {
        await disableEmailConnector(connector.uuid);
      } else {
        await deleteEmailConnector(connector.uuid);
      }
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey });
      notifier.success(t(`tenantIntegrations.notifications.${variables.action}Success`));
    },
    onError: () => {
      notifier.error(t("tenantIntegrations.notifications.actionError"));
    },
  });

  if (!tenantId) {
    return <div className="p-6 text-center text-destructive">{t("pages.workspaceMemberships.noActiveWorkspace")}</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <div>
          <h1 className="text-3xl font-bold">{t("tenantIntegrations.title")}</h1>
          <p className="text-muted-foreground">{t("tenantIntegrations.subtitle")}</p>
        </div>
        <div className="flex-1" />
        <Button onClick={() => setConnectDialogOpen(true)} disabled={!canManage}>
          <Plus className="mr-2 h-4 w-4" /> {t("tenantIntegrations.connectGmail")}
        </Button>
      </div>

      {!canRead || isError ? (
        <div className="text-center text-destructive py-10">{t("tenantIntegrations.loadError")}</div>
      ) : isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-10 w-10 animate-spin" />
        </div>
      ) : (
        <ConnectorsTable
          connectors={connectors}
          canManage={canManage}
          onSetDefault={(connector) => actionMutation.mutate({ action: "setDefault", connector })}
          onDisable={(connector) => actionMutation.mutate({ action: "disable", connector })}
          onDelete={(connector) => actionMutation.mutate({ action: "delete", connector })}
        />
      )}

      <ConnectGmailDialog
        open={connectDialogOpen}
        onOpenChange={setConnectDialogOpen}
        loading={connectMutation.isPending}
        onConnect={async (scopeMode) => {
          await connectMutation.mutateAsync(scopeMode);
        }}
      />
    </div>
  );
};

export default EmailIntegrationsPage;
