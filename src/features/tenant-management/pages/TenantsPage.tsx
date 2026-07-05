import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Pencil, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { notifier } from "@/services/NotificationService";
import { createTenant, getAllTenants, updateTenant } from "../api/tenants";
import { canCreatePlatformTenants, canReadPlatformTenants, canUpdatePlatformTenants } from "../model/access-policy";
import { getTenantUuidForPlatformOps } from "../model/helpers";
import type { CreateTenantRequest, TenantResponse, UpdateTenantRequest } from "../model/types";
import { TenantDialog } from "../components/TenantDialog";

export const TenantsPage: React.FC = () => {
  const { t } = useTranslation();
  const { principal } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<TenantResponse | null>(null);
  const authorities = principal?.authorities ?? [];
  const canRead = canReadPlatformTenants(authorities);
  const canCreate = canCreatePlatformTenants(authorities);
  const canUpdate = canUpdatePlatformTenants(authorities);

  const {
    data: tenants = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["tenants"],
    queryFn: getAllTenants,
    enabled: canRead,
  });

  const mutation = useMutation({
    mutationFn: (data: CreateTenantRequest | UpdateTenantRequest) =>
      selectedTenant
        ? updateTenant(getTenantUuidForPlatformOps(selectedTenant), data as UpdateTenantRequest)
        : createTenant(data as CreateTenantRequest),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      setDialogOpen(false);
      notifier.success(
        selectedTenant ? t("tenants.notifications.updateSuccess") : t("tenants.notifications.createSuccess")
      );
    },
    onError: () => {
      notifier.error(selectedTenant ? t("tenants.notifications.updateError") : t("tenants.notifications.createError"));
    },
  });

  const handleCreate = () => {
    if (!canCreate) {
      return;
    }

    setSelectedTenant(null);
    setDialogOpen(true);
  };

  const handleEdit = (tenant: TenantResponse) => {
    if (!canUpdate) {
      return;
    }

    setSelectedTenant(tenant);
    setDialogOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{t("tenants.title")}</h1>
        <Button onClick={handleCreate} disabled={!canCreate}>
          <Plus className="mr-2 h-4 w-4" /> {t("tenants.create")}
        </Button>
      </div>

      {!canRead ? (
        <div className="text-center text-destructive py-10">Failed to load tenants.</div>
      ) : isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-10 w-10 animate-spin" />
        </div>
      ) : isError ? (
        <div className="text-center text-destructive py-10">Failed to load tenants.</div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("tenants.columns.name")}</TableHead>
                <TableHead>{t("tenants.columns.timezone")}</TableHead>
                <TableHead>{t("tenants.columns.status")}</TableHead>
                <TableHead className="text-right">{t("common.list.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10">
                    {t("tenants.empty")}
                  </TableCell>
                </TableRow>
              ) : (
                tenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell className="font-medium">{tenant.name}</TableCell>
                    <TableCell>{tenant.timezone}</TableCell>
                    <TableCell>{tenant.status}</TableCell>
                    <TableCell className="text-right space-x-2">
                      {canUpdate ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={t("common.edit")}
                          onClick={() => handleEdit(tenant)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <TenantDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={async (data) => {
          if ((selectedTenant && !canUpdate) || (!selectedTenant && !canCreate)) {
            notifier.error(
              selectedTenant ? t("tenants.notifications.updateError") : t("tenants.notifications.createError")
            );
            return;
          }

          await mutation.mutateAsync(data);
        }}
        tenant={selectedTenant}
        loading={mutation.isPending}
      />
    </div>
  );
};

export default TenantsPage;
