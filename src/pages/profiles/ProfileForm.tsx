import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";
import { AlertCircleIcon, Loader2 } from "lucide-react";
import { validatePassword } from "@/services/PasswordValidator.ts";

export interface ProfileFormData {
  username: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  locale?: string;
}

interface ProfileFormProps {
  initialData?: ProfileFormData;
  mode: "create" | "edit";
  onSubmit: (data: ProfileFormData) => Promise<void>;
  isLoading: boolean;
  onCancel: () => void;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({ initialData, mode, onSubmit, isLoading, onCancel }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<ProfileFormData>({
    username: "",
    password: "",
    firstName: "",
    lastName: "",
    locale: "en-US", // Default locale
  });
  const [showPassword, setShowPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  const handleChange = (field: keyof ProfileFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === "password") {
      if (value) {
        setPasswordErrors(validatePassword(value));
      } else {
        setPasswordErrors([]);
      }
    }
    if (field === "username") {
      setUsernameError(null);
    }
  };

  const handleUsernameBlur = () => {
    const trimmed = formData.username.trim();
    if (trimmed !== formData.username) {
      setFormData((prev) => ({ ...prev, username: trimmed }));
    }

    if (!trimmed) {
      setUsernameError(null);
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9-._]+$/;
    if (!usernameRegex.test(trimmed)) {
      setUsernameError(
        t("pages.profileForm.validation.invalidUsername", "Username can only contain letters, digits, '-', '_', '.'.")
      );
    } else {
      setUsernameError(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameError || passwordErrors.length > 0) return;
    const trimmedUsername = formData.username.trim();
    onSubmit({ ...formData, username: trimmedUsername });
  };

  return (
    <div className="flex-1 bg-background py-0 px-0 sm:py-8 sm:px-4">
      <Card className="max-w-md w-full mx-auto">
        <CardHeader>
          <CardTitle>
            {mode === "create"
              ? t("pages.profileForm.createTitle", "Create Profile")
              : t("pages.profileForm.editTitle", "Edit Profile")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">{t("pages.profileForm.username", "Username")}</Label>
              <Input
                id="username"
                required
                disabled={mode === "edit" || isLoading}
                value={formData.username}
                onChange={(e) => handleChange("username", e.target.value)}
                onBlur={handleUsernameBlur}
              />
              {usernameError && (
                <Alert variant="destructive" className="mt-2" role="alert" aria-live="assertive">
                  <AlertCircleIcon className="h-4 w-4" />
                  <AlertDescription>{usernameError}</AlertDescription>
                </Alert>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="firstName">{t("pages.profileForm.firstName", "First Name")}</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">{t("pages.profileForm.lastName", "Last Name")}</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="locale">{t("pages.profileForm.locale", "Locale")}</Label>
              <Select value={formData.locale} onValueChange={(val) => handleChange("locale", val)} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder={t("pages.profileForm.localePlaceholder", "Select locale")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en-US">{t("pages.profileForm.locales.en", "English (US)")}</SelectItem>
                  <SelectItem value="uk-UA">{t("pages.profileForm.locales.uk", "Українська")}</SelectItem>
                  <SelectItem value="ru-RU">{t("pages.profileForm.locales.ru", "Русский")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                {mode === "create"
                  ? t("pages.profileForm.password", "Password")
                  : t("pages.profileForm.newPassword", "New Password (Optional)")}
              </Label>
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                required={mode === "create"}
                value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)}
                disabled={isLoading}
              />
              {passwordErrors.length > 0 && (
                <Alert variant="destructive" className="mt-2" role="alert" aria-live="assertive">
                  <AlertCircleIcon className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1">
                      {passwordErrors.map((msg, idx) => (
                        <li key={idx}>{msg}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-password"
                  checked={showPassword}
                  onCheckedChange={(checked) => setShowPassword(!!checked)}
                />
                <Label htmlFor="show-password" className="text-sm font-normal cursor-pointer">
                  {t("pages.profileForm.showPasswordLabel", "Show password")}
                </Label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                {t("common.cancel", "Cancel")}
              </Button>
              <Button type="submit" disabled={isLoading || passwordErrors.length > 0 || !!usernameError}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("common.save", "Save")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
