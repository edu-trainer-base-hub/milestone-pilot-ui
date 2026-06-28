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
  TenantRole,
  type TenantUserRequest,
  type TenantUserResponse,
  type UserRoleOption,
  formatRoleLabel,
} from "../types";
import { UserFormFields, type UserFormValues } from "./UserFormFields";

interface TenantUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TenantUserRequest) => Promise<void>;
  user?: TenantUserResponse | null;
  loading?: boolean;
}

const tenantRoleOptions: readonly UserRoleOption[] = Object.values(TenantRole).map((role) => ({
  value: role,
  label: formatRoleLabel(role),
}));

const emptyValues: UserFormValues = {
  email: "",
  firstName: "",
  lastName: "",
  role: TenantRole.ROLE_TENANT_MANAGER,
};

export const TenantUserDialog: React.FC<TenantUserDialogProps> = ({ open, onOpenChange, onSubmit, user, loading }) => {
  const { t } = useTranslation();
  const [values, setValues] = useState<UserFormValues>(emptyValues);

  const defaultValues = useMemo<UserFormValues>(
    () =>
      user
        ? {
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
          }
        : emptyValues,
    [user]
  );

  useEffect(() => {
    if (open) {
      setValues(defaultValues);
    }
  }, [defaultValues, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
          <UserFormFields values={values} onChange={setValues} roleOptions={tenantRoleOptions} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t("common.saving") : t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
