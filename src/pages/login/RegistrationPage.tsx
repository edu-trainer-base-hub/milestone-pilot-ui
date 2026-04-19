import React from "react";
import { useTranslation } from "react-i18next";
import { FormMode } from "@/hooks/use-registration-form.ts";
import GenericRegistrationForm from "@/pages/login/GenericRegistrationForm.tsx";

const RegistrationPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <GenericRegistrationForm
      formMode={FormMode.REGISTRATION}
      title={t("pages.registrationPage.titlePrompt")}
      sendCodeLabel={t("pages.registrationPage.confirmationCode.sendCodeButton")}
      submitLoadingLabel={t("pages.registrationPage.submitButtonLoading")}
      submitLabel={t("pages.registrationPage.submitButton")}
      secondaryText={t("pages.registrationPage.loginPrompt")}
      secondaryLinkText={t("pages.registrationPage.loginLinkText")}
      secondaryLinkTo="/login"
    />
  );
};

export default RegistrationPage;
