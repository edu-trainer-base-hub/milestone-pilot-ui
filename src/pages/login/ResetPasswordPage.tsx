import React from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import PasswordResetForm from "@/pages/login/PasswordResetForm.tsx";

const ResetPasswordPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  const email = searchParams.get("email") || "";
  const code = searchParams.get("code") || "";
  const mode = searchParams.get("mode");
  const isAccountSetup = mode === "tenant-account-setup";

  return (
    <PasswordResetForm
      initialEmail={email}
      initialCode={code}
      emailReadOnly={isAccountSetup}
      hideSendCode={isAccountSetup}
      submitSuccessMessage={isAccountSetup ? t("pages.accountSetup.notifications.submitSuccess") : undefined}
      title={isAccountSetup ? t("pages.accountSetup.titlePrompt") : t("pages.resetPasswordPage.titlePrompt")}
      sendCodeLabel={t("pages.resetPasswordPage.confirmationCode.sendCodeButton")}
      submitLoadingLabel={
        isAccountSetup ? t("pages.accountSetup.submitButtonLoading") : t("pages.resetPasswordPage.submitButtonLoading")
      }
      submitLabel={isAccountSetup ? t("pages.accountSetup.submitButton") : t("pages.resetPasswordPage.submitButton")}
      secondaryText={isAccountSetup ? t("pages.accountSetup.loginPrompt") : t("pages.resetPasswordPage.loginPrompt")}
      secondaryLinkText={t("pages.resetPasswordPage.loginLinkText")}
      secondaryLinkTo="/login"
    />
  );
};

export default ResetPasswordPage;
