import React, { useEffect, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CreateTenantRequest, TenantResponse, UpdateTenantRequest } from "../model/types";
import { TenantStatus, TENANT_STATUS_OPTIONS } from "../model/types";
import { TimezoneSelector } from "./TimezoneSelector";
import { SUPPORTED_LANGUAGES } from "@/constants/locales";

interface TenantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateTenantRequest | UpdateTenantRequest) => Promise<void>;
  tenant?: TenantResponse | null;
  loading?: boolean;
}

const getDefaultTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
};

export const TenantDialog: React.FC<TenantDialogProps> = ({ open, onOpenChange, onSubmit, tenant, loading }) => {
  const { t } = useTranslation();
  const isEdit = Boolean(tenant);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [timezone, setTimezone] = useState(getDefaultTimezone);
  const [locale, setLocale] = useState("en");
  const [status, setStatus] = useState<TenantStatus>(TenantStatus.ACTIVE);

  useEffect(() => {
    if (tenant) {
      setName(tenant.name);
      setEmail(tenant.email || "");
      setAddress(tenant.address || "");
      setTimezone(tenant.timezone || "UTC");
      setLocale(tenant.locale || "en");
      setStatus(tenant.status || TenantStatus.ACTIVE);
    } else {
      setName("");
      setEmail("");
      setAddress("");
      setTimezone(getDefaultTimezone());
      setLocale("en");
      setStatus(TenantStatus.ACTIVE);
    }
  }, [tenant, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (tenant) {
      await onSubmit({
        name,
        address,
        timezone,
        locale,
        status,
      });
      return;
    }

    await onSubmit({
      name,
      email,
      address,
      timezone,
      locale,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{tenant ? t("tenants.edit") : t("tenants.create")}</DialogTitle>
          <DialogDescription>{t("tenants.dialog.descriptionPlaceholder")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t("tenants.dialog.nameLabel")}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("tenants.dialog.namePlaceholder")}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t("tenants.dialog.emailLabel")}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("tenants.dialog.emailPlaceholder")}
              required
              readOnly={isEdit}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">{t("tenants.dialog.addressLabel")}</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={t("tenants.dialog.addressPlaceholder")}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">{t("tenants.dialog.timezoneLabel")}</Label>
            <TimezoneSelector
              id="timezone"
              value={timezone}
              onChange={setTimezone}
              placeholder={t("tenants.dialog.timezonePlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="locale">{t("tenants.dialog.localeLabel")}</Label>
            <Select value={locale} onValueChange={setLocale}>
              <SelectTrigger id="locale">
                <SelectValue placeholder={t("tenants.dialog.localePlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <SelectItem key={lang} value={lang}>
                    {t(`lang.name.${lang}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isEdit && (
            <div className="space-y-2">
              <Label htmlFor="status">{t("tenants.dialog.statusLabel")}</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as TenantStatus)}>
                <SelectTrigger id="status">
                  <SelectValue placeholder={t("tenants.dialog.statusPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {TENANT_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {t(`tenants.dialog.statusOptions.${option}`, option)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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
