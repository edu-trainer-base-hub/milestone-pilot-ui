import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TenantRequest, TenantResponse } from "../types";

interface TenantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TenantRequest) => Promise<void>;
  tenant?: TenantResponse | null;
  loading?: boolean;
}

export const TenantDialog: React.FC<TenantDialogProps> = ({ open, onOpenChange, onSubmit, tenant, loading }) => {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [locale, setLocale] = useState("en");
  const [status, setStatus] = useState("ACTIVE");

  useEffect(() => {
    if (tenant) {
      setName(tenant.name);
      setDescription(tenant.description || "");
      setEmail(tenant.email || "");
      setAddress(tenant.address || "");
      setTimezone(tenant.timezone || "UTC");
      setLocale(tenant.locale || "en");
      setStatus(tenant.status || "ACTIVE");
    } else {
      setName("");
      setDescription("");
      setEmail("");
      setAddress("");
      setTimezone("UTC");
      setLocale("en");
      setStatus("ACTIVE");
    }
  }, [tenant, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ name, description, email, address, timezone, locale, status });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{tenant ? t("tenants.edit") : t("tenants.create")}</DialogTitle>
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
            <Input
              id="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              placeholder={t("tenants.dialog.timezonePlaceholder")}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="locale">{t("tenants.dialog.localeLabel")}</Label>
            <Input
              id="locale"
              value={locale}
              onChange={(e) => setLocale(e.target.value)}
              placeholder={t("tenants.dialog.localePlaceholder")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">{t("tenants.dialog.statusLabel")}</Label>
            <Input
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              placeholder={t("tenants.dialog.statusPlaceholder")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">{t("tenants.dialog.descriptionLabel")}</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("tenants.dialog.descriptionPlaceholder")}
            />
          </div>
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
