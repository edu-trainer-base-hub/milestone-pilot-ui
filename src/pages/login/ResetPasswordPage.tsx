import React from "react";
import { useTranslation } from "react-i18next";
import GenericRegistrationForm from "@/pages/login/GenericRegistrationForm.tsx";
import { FormMode } from "@/hooks/use-registration-form.ts";

const ResetPasswordPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <GenericRegistrationForm
      formMode={FormMode.PASSWORD_RESET}
      title={t("pages.resetPasswordPage.titlePrompt")}
      sendCodeLabel={t("pages.resetPasswordPage.confirmationCode.sendCodeButton")}
      submitLoadingLabel={t("pages.resetPasswordPage.submitButtonLoading")}
      submitLabel={t("pages.resetPasswordPage.submitButton")}
      secondaryText={t("pages.resetPasswordPage.loginPrompt")}
      secondaryLinkText={t("pages.resetPasswordPage.loginLinkText")}
      secondaryLinkTo="/login"
    />
  );
};

export default ResetPasswordPage;
