import React, { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { notifier } from "@/services/NotificationService";
import { createPlatformUser, getPlatformUsers, updatePlatformUser } from "../api";
import {
  PlatformRole,
  formatRoleLabel,
  getPlatformUserId,
  type CreatePlatformUserRequest,
  type UpdatePlatformUserRequest,
  type UserRoleOption,
} from "../types";
import {
  canCreatePlatformUser,
  canReadPlatformUsers,
  canUpdatePlatformUser,
  getCreatablePlatformRoles,
} from "../access-policy";
import { PlatformUserForm } from "../components/PlatformUserForm";
import type { UserFormValues } from "../components/UserFormFields";

export const PlatformUserUpsertPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const { principal } = useAuth();
  const queryClient = useQueryClient();
  const isEdit = Boolean(userId);
  const authorities = principal?.authorities ?? [];
  const creatableRoles = getCreatablePlatformRoles(authorities);
  const editableRoles = useMemo(
    () =>
      [PlatformRole.ROLE_PLATFORM_ADMIN, PlatformRole.ROLE_PLATFORM_MANAGER].filter((role) =>
        canUpdatePlatformUser(authorities, role)
      ),
    [authorities]
  );
  const formRoles = isEdit ? editableRoles : creatableRoles;
  const roleOptions = useMemo<readonly UserRoleOption[]>(
    () =>
      formRoles.map((role) => ({
        value: role,
        label: formatRoleLabel(role),
      })),
    [formRoles]
  );
  const emptyValues = useMemo<UserFormValues>(
    () => ({
      email: "",
      firstName: "",
      lastName: "",
      role: formRoles[0] ?? "",
    }),
    [formRoles]
  );

  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ["platformUsers"],
    queryFn: getPlatformUsers,
    enabled: isEdit && canReadPlatformUsers(authorities),
  });

  const selectedUser = useMemo(() => users.find((user) => getPlatformUserId(user) === userId) ?? null, [userId, users]);
  const canEditSelectedUser = canUpdatePlatformUser(authorities, selectedUser?.platformRole ?? null);

  const mutation = useMutation({
    mutationFn: async (values: UserFormValues) => {
      if (
        (!isEdit && !canCreatePlatformUser(authorities, values.role)) ||
        (isEdit && (!canEditSelectedUser || !canUpdatePlatformUser(authorities, values.role)))
      ) {
        throw new Error("Unauthorized platform user mutation");
      }

      const request: CreatePlatformUserRequest | UpdatePlatformUserRequest = {
        email: values.email,
        firstName: values.firstName,
        lastName: values.lastName,
        role: values.role,
      };

      if (userId) {
        return updatePlatformUser(userId, request);
      }

      return createPlatformUser(request);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platformUsers"] });
      notifier.success(
        isEdit ? t("platformUsers.notifications.updateSuccess") : t("platformUsers.notifications.createSuccess")
      );
      navigate("/platform/users");
    },
    onError: () => {
      notifier.error(
        isEdit ? t("platformUsers.notifications.updateError") : t("platformUsers.notifications.createError")
      );
    },
  });

  if (isLoadingUsers) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  if (!isEdit && roleOptions.length === 0) {
    return <div className="p-6 text-center text-destructive">{t("platformUsers.notFound")}</div>;
  }

  if (isEdit && (!canReadPlatformUsers(authorities) || !selectedUser || !canEditSelectedUser)) {
    return <div className="p-6 text-center text-destructive">{t("platformUsers.notFound")}</div>;
  }

  return (
    <PlatformUserForm
      title={isEdit ? t("platformUsers.edit") : t("platformUsers.create")}
      defaultValues={
        selectedUser
          ? {
              email: selectedUser.email,
              firstName: selectedUser.firstName,
              lastName: selectedUser.lastName,
              role: selectedUser.platformRole,
            }
          : emptyValues
      }
      roleOptions={roleOptions}
      loading={mutation.isPending}
      onCancel={() => navigate("/platform/users")}
      onSubmit={async (values) => {
        if (!isEdit && !canCreatePlatformUser(authorities, values.role)) {
          notifier.error(t("platformUsers.notifications.createError"));
          return;
        }

        if (isEdit && (!canEditSelectedUser || !canUpdatePlatformUser(authorities, values.role))) {
          notifier.error(t("platformUsers.notifications.updateError"));
          return;
        }

        await mutation.mutateAsync(values);
      }}
    />
  );
};

export default PlatformUserUpsertPage;
