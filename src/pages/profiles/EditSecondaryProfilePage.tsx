import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ProfileForm, type ProfileFormData } from "./ProfileForm";
import ProfileService from "@/services/ProfileService";
import { extractErrorCode } from "@/services/ApiService";
import { notifier } from "@/services/NotificationService";
import { Loader2 } from "lucide-react";

export const EditSecondaryProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["secondaryProfile", id],
    queryFn: () => ProfileService.retrieveSecondary(id!),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (data: ProfileFormData) =>
      ProfileService.updateSecondary(id!, {
        firstName: data.firstName,
        lastName: data.lastName,
        locale: data.locale,
        password: data.password || undefined, // Only send if set
      }),
    onSuccess: () => {
      notifier.success(t("pages.editProfile.success", "Profile updated successfully"));
      queryClient.invalidateQueries({ queryKey: ["secondaryProfiles"] });
      navigate("/settings/profiles");
    },
    onError: (error: unknown) => {
      const errorCode = extractErrorCode(error);
      const messageKey = errorCode ? `errors.codes.${errorCode}` : "pages.editProfile.error";
      const message = t(messageKey, {
        defaultValue: t("errors.codes.UNKNOWN"),
      });

      notifier.error(message);
      console.error(error);
    },
  });

  const handleSubmit = async (data: ProfileFormData) => {
    if (!id) return;
    await updateMutation.mutateAsync(data);
  };

  if (isLoadingProfile) {
    return (
      <div className="flex justify-center items-center flex-1 bg-background">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex justify-center items-center flex-1 bg-background">
        <p>{t("pages.editProfile.notFound", "Profile not found")}</p>
      </div>
    );
  }

  return (
    <ProfileForm
      mode="edit"
      initialData={{
        username: profile.username,
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        locale: profile.locale,
      }}
      onSubmit={handleSubmit}
      isLoading={updateMutation.isPending}
      onCancel={() => navigate("/settings/profiles")}
    />
  );
};

export default EditSecondaryProfilePage;
