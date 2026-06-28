import React, { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { notifier } from "@/services/NotificationService";
import { createPlatformUser, getPlatformUsers, updatePlatformUser } from "../api";
import { PlatformRole, formatRoleLabel, type PlatformUserRequest, type UserRoleOption } from "../types";
import { PlatformUserForm } from "../components/PlatformUserForm";
import type { UserFormValues } from "../components/UserFormFields";

const platformRoleOptions: readonly UserRoleOption[] = Object.values(PlatformRole).map((role) => ({
  value: role,
  label: formatRoleLabel(role),
}));

const emptyValues: UserFormValues = {
  email: "",
  firstName: "",
  lastName: "",
  role: PlatformRole.ROLE_PLATFORM_MANAGER,
};

export const PlatformUserUpsertPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const queryClient = useQueryClient();
  const isEdit = Boolean(userId);

  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ["platformUsers"],
    queryFn: getPlatformUsers,
  });

  const selectedUser = useMemo(() => users.find((user) => user.id === userId) ?? null, [userId, users]);

  const mutation = useMutation({
    mutationFn: async (values: UserFormValues) => {
      const request: PlatformUserRequest = {
        email: values.email,
        firstName: values.firstName,
        lastName: values.lastName,
        platformRole: values.role,
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
      notifier.error(isEdit ? t("platformUsers.notifications.updateError") : t("platformUsers.notifications.createError"));
    },
  });

  if (isLoadingUsers) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  if (isEdit && !selectedUser) {
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
      roleOptions={platformRoleOptions}
      loading={mutation.isPending}
      onCancel={() => navigate("/platform/users")}
      onSubmit={async (values) => {
        await mutation.mutateAsync(values);
      }}
    />
  );
};

export default PlatformUserUpsertPage;
