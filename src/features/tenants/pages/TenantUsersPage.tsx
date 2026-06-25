import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Loader2, Plus } from "lucide-react";
import { notifier } from "@/services/NotificationService";
import { getUsersByTenant, createUserInTenant } from "../api";
import type { TenantUserRequest } from "../types";
import { TenantUserDialog } from "../components/TenantUserDialog";

export const TenantUsersPage: React.FC = () => {
  const { t } = useTranslation();
  const { tenantId } = useParams<{ tenantId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);

  const {
    data: users = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["tenantUsers", tenantId],
    queryFn: () => getUsersByTenant(tenantId!),
    enabled: !!tenantId,
  });

  const mutation = useMutation({
    mutationFn: (data: TenantUserRequest) =>
      createUserInTenant(tenantId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenantUsers", tenantId] });
      setDialogOpen(false);
      notifier.success(t("tenants.notifications.createUserSuccess"));
    },
    onError: () => {
      notifier.error(t("tenants.notifications.createUserError"));
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/tenants")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">{t("tenants.users.title")}</h1>
        <div className="flex-1" />
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> {t("tenants.users.create")}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-10 w-10 animate-spin" />
        </div>
      ) : isError ? (
        <div className="text-center text-destructive py-10">
          Failed to load tenant users.
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("tenants.users.columns.firstName")}</TableHead>
                <TableHead>{t("tenants.users.columns.lastName")}</TableHead>
                <TableHead>{t("tenants.users.columns.email")}</TableHead>
                <TableHead>{t("tenants.users.columns.role")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10">
                    {t("tenants.users.empty")}
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.firstName}</TableCell>
                    <TableCell>{user.lastName}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {user.role.replace("ROLE_", "").replace("_", " ")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <TenantUserDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={async (data) => {
          await mutation.mutateAsync(data);
        }}
        loading={mutation.isPending}
      />
    </div>
  );
};

export default TenantUsersPage;
