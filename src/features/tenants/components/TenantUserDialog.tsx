import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  type CreateTenantUserRequest,
  type TenantUserResponse,
  type UpdateTenantUserRequest,
  type UserRoleOption,
} from "../types";
import { UserFormFields, type UserFormValues } from "./UserFormFields";

interface TenantUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateTenantUserRequest | UpdateTenantUserRequest) => Promise<void>;
  user?: TenantUserResponse | null;
  loading?: boolean;
  roleOptions: readonly UserRoleOption[];
  defaultRole?: string | null;
}

const emptyValues = (role: string): UserFormValues => ({
  email: "",
  firstName: "",
  lastName: "",
  role,
});

export const TenantUserDialog: React.FC<TenantUserDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  user,
  loading,
  roleOptions,
  defaultRole,
}) => {
  const { t } = useTranslation();
  const fallbackRole = defaultRole ?? roleOptions[0]?.value ?? "";
  const [values, setValues] = useState<UserFormValues>(emptyValues(fallbackRole));
  const hasAllowedRole = roleOptions.some((roleOption) => roleOption.value === values.role);

  const defaultValues = useMemo<UserFormValues>(
    () =>
      user
        ? {
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: roleOptions.some((roleOption) => roleOption.value === user.role) ? user.role : fallbackRole,
          }
        : emptyValues(fallbackRole),
    [fallbackRole, roleOptions, user]
  );

  useEffect(() => {
    if (open) {
      setValues(defaultValues);
    }
  }, [defaultValues, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasAllowedRole) {
      return;
    }

    await onSubmit({
      email: values.email,
      firstName: values.firstName,
      lastName: values.lastName,
      role: values.role,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{user ? t("tenants.users.edit") : t("tenants.users.create")}</DialogTitle>
          <DialogDescription>{t("tenants.dialog.roleLabel")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <UserFormFields
            values={values}
            onChange={setValues}
            roleOptions={roleOptions}
            roleDisabled={roleOptions.length === 0}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={loading || !hasAllowedRole}>
              {loading ? t("common.saving") : t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
