import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { UserFormFields, type UserFormValues, type UserRoleOption } from "@/components/forms/UserFormFields";

interface PlatformUserFormProps {
  defaultValues: UserFormValues;
  title: string;
  isEdit?: boolean;
  roleOptions: readonly UserRoleOption[];
  loading?: boolean;
  onSubmit: (values: UserFormValues) => Promise<void>;
  onCancel: () => void;
}

export const PlatformUserForm: React.FC<PlatformUserFormProps> = ({
  defaultValues,
  title,
  isEdit = false,
  roleOptions,
  loading = false,
  onSubmit,
  onCancel,
}) => {
  const { t } = useTranslation();
  const [values, setValues] = useState<UserFormValues>(defaultValues);

  useEffect(() => {
    setValues(defaultValues);
  }, [defaultValues]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit(values);
  };

  return (
    <div className="p-6">
      <Button type="button" variant="ghost" className="mb-4 px-0" onClick={onCancel}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        {t("users.backToList")}
      </Button>

      <Card className="mx-auto w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <UserFormFields
              values={values}
              onChange={setValues}
              roleOptions={roleOptions}
              emailLabel={t("users.form.emailLabel")}
              emailPlaceholder={t("users.form.emailPlaceholder")}
              emailReadOnly={isEdit}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? t("common.saving") : t("common.save")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
