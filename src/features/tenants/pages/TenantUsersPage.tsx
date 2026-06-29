import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Loader2, Pencil, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { notifier } from "@/services/NotificationService";
import { createUserInTenant, getUsersByTenant, updateUserInTenant } from "../api";
import type { CreateTenantUserRequest, TenantUserResponse, UpdateTenantUserRequest } from "../types";
import {
  canManageTenantUser,
  formatRoleLabel,
  getAssignableTenantRoles,
  getTenantRoleOptions,
  getTenantUserId,
} from "../types";
import { TenantUserDialog } from "../components/TenantUserDialog";

export const TenantUsersPage: React.FC = () => {
  const { t } = useTranslation();
  const { tenantId } = useParams<{ tenantId: string }>();
  const { principal } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<TenantUserResponse | null>(null);
  const effectiveTenantId = tenantId ?? principal?.activeTenantUuid ?? null;
  const hasPlatformTenantContext = Boolean(tenantId);
  const actorTenantRole = principal?.activeTenantRole ?? null;
  const assignableRoles = getAssignableTenantRoles(actorTenantRole);
  const roleOptions = getTenantRoleOptions(actorTenantRole);
  const canCreateUsers = assignableRoles.length > 0;

  const {
    data: users = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["tenantUsers", effectiveTenantId],
    queryFn: () => getUsersByTenant(effectiveTenantId!),
    enabled: !!effectiveTenantId,
  });

  const mutation = useMutation({
    mutationFn: (data: CreateTenantUserRequest | UpdateTenantUserRequest) =>
      selectedUser
        ? updateUserInTenant(effectiveTenantId!, getTenantUserId(selectedUser), data as UpdateTenantUserRequest)
        : createUserInTenant(effectiveTenantId!, data as CreateTenantUserRequest),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenantUsers", effectiveTenantId] });
      setDialogOpen(false);
      setSelectedUser(null);
      notifier.success(
        selectedUser ? t("tenants.notifications.updateUserSuccess") : t("tenants.notifications.createUserSuccess")
      );
    },
    onError: () => {
      notifier.error(
        selectedUser ? t("tenants.notifications.updateUserError") : t("tenants.notifications.createUserError")
      );
    },
  });

  const handleCreate = () => {
    if (!canCreateUsers) {
      return;
    }

    setSelectedUser(null);
    setDialogOpen(true);
  };

  const handleEdit = (user: TenantUserResponse) => {
    if (!canManageTenantUser(actorTenantRole, user.role)) {
      return;
    }

    setSelectedUser(user);
    setDialogOpen(true);
  };

  if (!effectiveTenantId) {
    return <div className="p-6 text-center text-destructive">{t("pages.tenantMemberships.noActiveTenant")}</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(hasPlatformTenantContext ? "/platform/tenants" : "/")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">{t("tenants.users.title")}</h1>
        <div className="flex-1" />
        <Button onClick={handleCreate} disabled={!canCreateUsers}>
          <Plus className="mr-2 h-4 w-4" /> {t("tenants.users.create")}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-10 w-10 animate-spin" />
        </div>
      ) : isError ? (
        <div className="text-center text-destructive py-10">Failed to load tenant users.</div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("tenants.users.columns.firstName")}</TableHead>
                <TableHead>{t("tenants.users.columns.lastName")}</TableHead>
                <TableHead>{t("tenants.users.columns.email")}</TableHead>
                <TableHead>{t("tenants.users.columns.role")}</TableHead>
                <TableHead className="text-right">{t("common.list.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    {t("tenants.users.empty")}
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={getTenantUserId(user)}>
                    <TableCell>{user.firstName}</TableCell>
                    <TableCell>{user.lastName}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{formatRoleLabel(user.role)}</TableCell>
                    <TableCell className="text-right">
                      {canManageTenantUser(actorTenantRole, user.role) ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={t("common.edit")}
                          onClick={() => handleEdit(user)}
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

      <TenantUserDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={async (data) => {
          if (!assignableRoles.some((role) => role === data.role)) {
            notifier.error(
              selectedUser ? t("tenants.notifications.updateUserError") : t("tenants.notifications.createUserError")
            );
            return;
          }

          if (selectedUser && !canManageTenantUser(actorTenantRole, selectedUser.role)) {
            notifier.error(t("tenants.notifications.updateUserError"));
            setDialogOpen(false);
            setSelectedUser(null);
            return;
          }

          await mutation.mutateAsync(data);
        }}
        user={selectedUser}
        loading={mutation.isPending}
        roleOptions={roleOptions}
        defaultRole={assignableRoles[0] ?? null}
      />
    </div>
  );
};

export default TenantUsersPage;
