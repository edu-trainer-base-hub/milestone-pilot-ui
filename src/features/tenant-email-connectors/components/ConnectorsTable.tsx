import React from "react";
import { useTranslation } from "react-i18next";
import { Ban, Star, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmailConnectorStatus, type EmailConnectorResponse } from "../model/types";

interface ConnectorsTableProps {
  connectors: EmailConnectorResponse[];
  canManage: boolean;
  onSetDefault: (connector: EmailConnectorResponse) => void;
  onDisable: (connector: EmailConnectorResponse) => void;
  onDelete: (connector: EmailConnectorResponse) => void;
}

const statusVariant = (status: EmailConnectorResponse["status"]): "default" | "secondary" | "destructive" => {
  switch (status) {
    case EmailConnectorStatus.ACTIVE:
      return "default";
    case EmailConnectorStatus.DISABLED:
      return "secondary";
    default:
      return "destructive";
  }
};

const formatDateTime = (value: string | null): string => (value ? new Date(value).toLocaleString() : "—");

export const ConnectorsTable: React.FC<ConnectorsTableProps> = ({
  connectors,
  canManage,
  onSetDefault,
  onDisable,
  onDelete,
}) => {
  const { t } = useTranslation();

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("tenantIntegrations.columns.emailAddress")}</TableHead>
            <TableHead>{t("tenantIntegrations.columns.scopeMode")}</TableHead>
            <TableHead>{t("tenantIntegrations.columns.status")}</TableHead>
            <TableHead>{t("tenantIntegrations.columns.default")}</TableHead>
            <TableHead>{t("tenantIntegrations.columns.lastSuccessAt")}</TableHead>
            <TableHead>{t("tenantIntegrations.columns.lastError")}</TableHead>
            <TableHead className="text-right">{t("common.list.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {connectors.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-10">
                {t("tenantIntegrations.empty")}
              </TableCell>
            </TableRow>
          ) : (
            connectors.map((connector) => (
              <TableRow key={connector.uuid}>
                <TableCell>{connector.emailAddress}</TableCell>
                <TableCell>{t(`tenantIntegrations.scopeModes.${connector.scopeMode}`)}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant(connector.status)}>
                    {t(`tenantIntegrations.statuses.${connector.status}`)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {connector.default ? <Star className="h-4 w-4 fill-current text-yellow-500" /> : null}
                </TableCell>
                <TableCell>{formatDateTime(connector.lastSuccessAt)}</TableCell>
                <TableCell className="max-w-56 truncate" title={connector.lastErrorMessage ?? undefined}>
                  {connector.status === EmailConnectorStatus.REVOKED || connector.status === EmailConnectorStatus.ERROR
                    ? (connector.lastErrorMessage ?? t("tenantIntegrations.reconnectRequired"))
                    : "—"}
                </TableCell>
                <TableCell className="text-right">
                  {canManage ? (
                    <div className="flex justify-end gap-1">
                      {!connector.default && connector.status === EmailConnectorStatus.ACTIVE ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={t("tenantIntegrations.actions.setDefault")}
                          title={t("tenantIntegrations.actions.setDefault")}
                          onClick={() => onSetDefault(connector)}
                        >
                          <Star className="h-4 w-4" />
                        </Button>
                      ) : null}
                      {connector.status !== EmailConnectorStatus.DISABLED ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={t("tenantIntegrations.actions.disable")}
                          title={t("tenantIntegrations.actions.disable")}
                          onClick={() => onDisable(connector)}
                        >
                          <Ban className="h-4 w-4" />
                        </Button>
                      ) : null}
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={t("common.delete")}
                        title={t("common.delete")}
                        onClick={() => onDelete(connector)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : null}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
