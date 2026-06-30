import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "react-i18next";
import type { UserRoleOption } from "../types";

export interface UserFormValues {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface UserFormFieldsProps {
  values: UserFormValues;
  onChange: (values: UserFormValues) => void;
  roleOptions: readonly UserRoleOption[];
  emailLabel: string;
  emailPlaceholder: string;
  emailReadOnly?: boolean;
  roleDisabled?: boolean;
}

export const UserFormFields: React.FC<UserFormFieldsProps> = ({
  values,
  onChange,
  roleOptions,
  emailLabel,
  emailPlaceholder,
  emailReadOnly = false,
  roleDisabled = false,
}) => {
  const { t } = useTranslation();

  const setField =
    <K extends keyof UserFormValues>(field: K) =>
    (value: UserFormValues[K]) => {
      onChange({
        ...values,
        [field]: value,
      });
    };

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="email">{emailLabel}</Label>
        <Input
          id="email"
          type="email"
          value={values.email}
          onChange={(event) => setField("email")(event.target.value)}
          placeholder={emailPlaceholder}
          required
          readOnly={emailReadOnly}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="firstName">{t("tenants.dialog.firstNameLabel")}</Label>
        <Input
          id="firstName"
          value={values.firstName}
          onChange={(event) => setField("firstName")(event.target.value)}
          placeholder={t("tenants.dialog.firstNamePlaceholder")}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="lastName">{t("tenants.dialog.lastNameLabel")}</Label>
        <Input
          id="lastName"
          value={values.lastName}
          onChange={(event) => setField("lastName")(event.target.value)}
          placeholder={t("tenants.dialog.lastNamePlaceholder")}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="role">{t("tenants.dialog.roleLabel")}</Label>
        <Select value={values.role} onValueChange={(value) => setField("role")(value)} disabled={roleDisabled}>
          <SelectTrigger id="role">
            <SelectValue placeholder={t("users.form.rolePlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            {roleOptions.map((roleOption) => (
              <SelectItem key={roleOption.value} value={roleOption.value}>
                {roleOption.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
};
