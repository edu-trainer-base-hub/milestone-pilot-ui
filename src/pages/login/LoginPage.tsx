import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";
import { AlertCircleIcon, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext.tsx";
import { extractErrorCode } from "@/services/ApiService.ts";
import { notifier } from "@/services/NotificationService.ts";
import LanguageSelector, { LanguageSelectorMode } from "@/components/lang/LanguageSelector.tsx";

export const LoginPage: React.FC = () => {
  const { t } = useTranslation();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const trimmedIdentifier = identifier.trim();
    if (trimmedIdentifier !== identifier) {
      setIdentifier(trimmedIdentifier);
    }

    try {
      await login(trimmedIdentifier, password);
      navigate(from, { replace: true });
    } catch (error: unknown) {
      const errorCode = extractErrorCode(error);
      const messageKey = errorCode ? `errors.codes.${errorCode}` : "pages.loginPage.notifications.submitError";
      const message = t(messageKey, {
        defaultValue: t("errors.codes.UNKNOWN"),
      });

      setError(message);
      notifier.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-8">
      <Card className="relative w-full max-w-md">
        <div className="absolute top-4 right-6">
          <LanguageSelector mode={LanguageSelectorMode.ICON} />
        </div>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">{t("pages.loginPage.titlePrompt")}</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircleIcon />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier">{t("pages.loginPage.identifier.label")}</Label>
              <Input
                id="identifier"
                placeholder={t("pages.loginPage.identifier.placeholder")}
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                onBlur={() => setIdentifier((prev) => prev.trim())}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{t("pages.loginPage.password.label")}</Label>
                <Link to="/password/reset" className="text-sm text-primary hover:underline">
                  {t("pages.loginPage.password.forgotPasswordLinkText")}
                </Link>
              </div>
              <Input
                id="password"
                required
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-password"
                  checked={showPassword}
                  onCheckedChange={(checked) => setShowPassword(!!checked)}
                />
                <Label htmlFor="show-password" className="text-sm font-normal cursor-pointer">
                  {t("pages.loginPage.password.showPasswordLabel")}
                </Label>
              </div>
            </div>
            <Button className="w-full" type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? t("pages.loginPage.submitButtonLoading") : t("pages.loginPage.submitButton")}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            {t("pages.loginPage.registrationPrompt")}{" "}
            <Link to="/register" className="text-primary hover:underline">
              {t("pages.loginPage.registrationLinkText")}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
