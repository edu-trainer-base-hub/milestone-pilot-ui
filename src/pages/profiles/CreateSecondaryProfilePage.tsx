import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ProfileForm, type ProfileFormData } from "./ProfileForm";
import ProfileService from "@/services/ProfileService";
import { extractErrorCode } from "@/services/ApiService";
import { notifier } from "@/services/NotificationService";

export const CreateSecondaryProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: ProfileFormData) => ProfileService.createSecondary(data),
    onSuccess: () => {
      notifier.success(t("pages.createProfile.success", "Profile created successfully"));
      queryClient.invalidateQueries({ queryKey: ["secondaryProfiles"] });
      navigate("/settings/profiles");
    },
    onError: (error: unknown) => {
      const errorCode = extractErrorCode(error);
      const messageKey = errorCode ? `errors.codes.${errorCode}` : "pages.createProfile.error";
      const message = t(messageKey, {
        defaultValue: t("errors.codes.UNKNOWN"),
      });

      notifier.error(message);
      console.error(error);
    },
  });

  const handleSubmit = async (data: ProfileFormData) => {
    await createMutation.mutateAsync(data);
  };

  return (
    <ProfileForm
      mode="create"
      onSubmit={handleSubmit}
      isLoading={createMutation.isPending}
      onCancel={() => navigate("/settings/profiles")}
    />
  );
};

export default CreateSecondaryProfilePage;
