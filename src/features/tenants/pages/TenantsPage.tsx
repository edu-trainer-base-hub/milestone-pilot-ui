import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Pencil, Plus, Users } from "lucide-react";
import { notifier } from "@/services/NotificationService";
import { getAllTenants, createTenant, updateTenant } from "../api";
import type { TenantRequest, TenantResponse } from "../types";
import { TenantDialog } from "../components/TenantDialog";

export const TenantsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<TenantResponse | null>(null);

  const {
    data: tenants = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["tenants"],
    queryFn: getAllTenants,
  });

  const mutation = useMutation({
    mutationFn: (data: TenantRequest) => (selectedTenant ? updateTenant(selectedTenant.id, data) : createTenant(data)),
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
    setSelectedTenant(null);
    setDialogOpen(true);
  };

  const handleEdit = (tenant: TenantResponse) => {
    setSelectedTenant(tenant);
    setDialogOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{t("tenants.title")}</h1>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" /> {t("tenants.create")}
        </Button>
      </div>

      {isLoading ? (
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
                <TableHead>{t("tenants.columns.description")}</TableHead>
                <TableHead>{t("tenants.columns.timezone")}</TableHead>
                <TableHead>{t("tenants.columns.status")}</TableHead>
                <TableHead className="text-right">{t("common.list.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    {t("tenants.empty")}
                  </TableCell>
                </TableRow>
              ) : (
                tenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell className="font-medium">{tenant.name}</TableCell>
                    <TableCell>{tenant.description}</TableCell>
                    <TableCell>{tenant.timezone}</TableCell>
                    <TableCell>{tenant.status}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => navigate(`${tenant.id}/users`)}>
                        <Users className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(tenant)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
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
          await mutation.mutateAsync(data);
        }}
        tenant={selectedTenant}
        loading={mutation.isPending}
      />
    </div>
  );
};

export default TenantsPage;
