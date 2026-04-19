import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";
import { AlertCircleIcon, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { FormMode, useRegistrationForm } from "@/hooks/use-registration-form.ts";
import LanguageSelector, { LanguageSelectorMode } from "@/components/lang/LanguageSelector.tsx";

export interface VerificationFormProps {
  formMode: FormMode;
  title: string;
  sendCodeLabel: string;
  submitLoadingLabel: string;
  submitLabel: string;
  secondaryText: string;
  secondaryLinkText: string;
  secondaryLinkTo: string;
}

const GenericRegistrationForm: React.FC<VerificationFormProps> = ({
  formMode,
  title,
  sendCodeLabel,
  submitLoadingLabel,
  submitLabel,
  secondaryText,
  secondaryLinkText,
  secondaryLinkTo,
}) => {
  const {
    email,
    emailError,
    codeSent,
    confirmationCode,
    codeError,
    password,
    confirmPassword,
    passwordErrors,
    confirmError,
    sendCodeLoading,
    submitLoading,
    submitError,
    secondsLeft,
    handleEmailChange,
    handleEmailBlur,
    handleSendCode,
    handleCodeChange,
    handlePasswordChange,
    handleConfirmChange,
    handleSubmit,
  } = useRegistrationForm({ mode: formMode });

  const [showPassword, setShowPassword] = useState(false);

  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-8">
      <Card className="relative w-full max-w-md">
        <div className="absolute top-4 right-6">
          <LanguageSelector mode={LanguageSelectorMode.ICON} />
        </div>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">{title}</CardTitle>
        </CardHeader>

        <CardContent>
          {(submitError || confirmError || codeError) && (
            <Alert variant="destructive" className="mb-4" role="alert" aria-live="assertive">
              <AlertCircleIcon />
              <AlertDescription>{submitError ?? confirmError ?? codeError}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">{t("pages.registrationPage.email.label")}</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                required
                value={email}
                onChange={handleEmailChange}
                onBlur={handleEmailBlur}
                disabled={sendCodeLoading || submitLoading}
                autoFocus
              />
              {emailError && (
                <Alert variant="destructive" className="mt-2" role="alert" aria-live="assertive">
                  <AlertDescription>{emailError}</AlertDescription>
                </Alert>
              )}
            </div>

            {/* Send Confirmation Code */}
            <Button
              type="button"
              className="w-full flex items-center justify-center"
              onClick={handleSendCode}
              disabled={sendCodeLoading || submitLoading || !!emailError || !email || secondsLeft > 0}
            >
              {sendCodeLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("pages.registrationPage.confirmationCode.sendCodeButtonLoading")}
                </>
              ) : secondsLeft > 0 ? (
                t("pages.registrationPage.confirmationCode.sendCodeButtonRe", {
                  secondsLeft,
                })
              ) : (
                sendCodeLabel
              )}
            </Button>

            {/* Confirmation Code */}
            {codeSent && (
              <div className="space-y-2">
                <Label htmlFor="confirmationCode">{t("pages.registrationPage.confirmationCode.label")}</Label>
                <Input
                  id="confirmationCode"
                  type="text"
                  placeholder="123456"
                  required
                  value={confirmationCode}
                  onChange={handleCodeChange}
                  disabled={sendCodeLoading || submitLoading}
                />
                {codeError && (
                  <Alert variant="destructive" className="mt-2" role="alert" aria-live="assertive">
                    <AlertDescription>{codeError}</AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">{t("pages.registrationPage.password.label")}</Label>
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={handlePasswordChange}
                disabled={submitLoading}
              />
              {passwordErrors.length > 0 && (
                <Alert variant="destructive" className="mt-2" role="alert" aria-live="assertive">
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1">
                      {passwordErrors.map((msg, idx) => (
                        <li key={idx}>{msg}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t("pages.registrationPage.confirmPassword.label")}</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={handleConfirmChange}
                disabled={submitLoading}
              />
              <div className="flex items-center space-x-2 mt-2">
                <Checkbox
                  id="show-password"
                  checked={showPassword}
                  onCheckedChange={(checked) => setShowPassword(!!checked)}
                />
                <Label htmlFor="show-password" className="text-sm font-normal cursor-pointer">
                  {t(
                    formMode === FormMode.REGISTRATION
                      ? "pages.registrationPage.password.showPasswordLabel"
                      : "pages.resetPasswordPage.password.showPasswordLabel"
                  )}
                </Label>
              </div>
              {confirmError && (
                <Alert variant="destructive" className="mt-2" role="alert" aria-live="assertive">
                  <AlertDescription>{confirmError}</AlertDescription>
                </Alert>
              )}
            </div>

            {/* Submit */}
            <Button
              className="w-full flex items-center justify-center"
              type="submit"
              disabled={
                submitLoading ||
                sendCodeLoading ||
                !email ||
                !!emailError ||
                !confirmationCode ||
                !!codeError ||
                !password ||
                !confirmPassword ||
                passwordErrors.length > 0 ||
                !!confirmError
              }
            >
              {submitLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitLoading ? submitLoadingLabel : submitLabel}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            {secondaryText}{" "}
            <Link to={secondaryLinkTo} className="text-primary hover:underline">
              {secondaryLinkText}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GenericRegistrationForm;
