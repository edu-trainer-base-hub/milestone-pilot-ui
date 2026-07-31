import type { FormEvent, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { TenantUserResponse } from "@/features/tenant-users/model/types";
import type { BidEditDraft } from "../model/bid-edit";
import { BidPriority } from "../model/types";

const UNASSIGNED = "__unassigned__";

interface BidEditFormProps {
  draft: BidEditDraft;
  tenantUsers: TenantUserResponse[];
  onChange: (draft: BidEditDraft) => void;
  onSubmit: () => void;
}

export function BidEditForm({ draft, tenantUsers, onChange, onSubmit }: BidEditFormProps) {
  const { t } = useTranslation();
  const update = <K extends keyof BidEditDraft>(field: K, value: BidEditDraft[K]) =>
    onChange({ ...draft, [field]: value });
  const assignedUserMissing =
    draft.assignedToUserUuid && !tenantUsers.some((user) => user.uuid === draft.assignedToUserUuid);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form id="bid-edit-form" className="grid gap-6 xl:grid-cols-2" onSubmit={submit}>
      <EditSection title={t("bids.sections.project")}>
        <TextField
          required
          label={t("bids.fields.projectName")}
          name="projectName"
          value={draft.projectName}
          onChange={(value) => update("projectName", value)}
        />
        <TextField
          label={t("bids.fields.bidPackage")}
          name="bidPackage"
          value={draft.bidPackage}
          onChange={(value) => update("bidPackage", value)}
        />
        <TextAreaField
          wide
          label={t("bids.fields.projectDescription")}
          name="projectDescription"
          value={draft.projectDescription}
          onChange={(value) => update("projectDescription", value)}
        />
        <TextAreaField
          wide
          label={t("bids.fields.scopeSummary")}
          name="scopeSummary"
          value={draft.scopeSummary}
          onChange={(value) => update("scopeSummary", value)}
        />
        <TextField
          wide
          label={t("bids.fields.trades")}
          description={t("bids.form.tradesHint")}
          name="trades"
          value={draft.trades}
          onChange={(value) => update("trades", value)}
        />
      </EditSection>

      <EditSection title={t("bids.sections.identifiers")}>
        <TextField
          label={t("bids.fields.projectNumber")}
          name="projectNumber"
          value={draft.projectNumber}
          onChange={(value) => update("projectNumber", value)}
        />
        <TextField
          label={t("bids.fields.solicitationNumber")}
          name="solicitationNumber"
          value={draft.solicitationNumber}
          onChange={(value) => update("solicitationNumber", value)}
        />
        <TextField
          label={t("bids.fields.bidPackageNumber")}
          name="bidPackageNumber"
          value={draft.bidPackageNumber}
          onChange={(value) => update("bidPackageNumber", value)}
        />
        <TextField
          label={t("bids.fields.externalPlatform")}
          name="externalPlatform"
          value={draft.externalPlatform}
          onChange={(value) => update("externalPlatform", value)}
        />
        <TextField
          wide
          label={t("bids.fields.externalOpportunityId")}
          name="externalOpportunityId"
          value={draft.externalOpportunityId}
          onChange={(value) => update("externalOpportunityId", value)}
        />
      </EditSection>

      <EditSection title={t("bids.sections.location")}>
        <TextField
          label={t("bids.fields.siteName")}
          name="siteName"
          value={draft.siteName}
          onChange={(value) => update("siteName", value)}
        />
        <TextField
          label={t("bids.fields.fullAddress")}
          name="fullAddress"
          value={draft.fullAddress}
          onChange={(value) => update("fullAddress", value)}
        />
        <TextField
          label={t("bids.fields.addressLine1")}
          name="addressLine1"
          value={draft.addressLine1}
          onChange={(value) => update("addressLine1", value)}
        />
        <TextField
          label={t("bids.fields.addressLine2")}
          name="addressLine2"
          value={draft.addressLine2}
          onChange={(value) => update("addressLine2", value)}
        />
        <TextField
          label={t("bids.fields.city")}
          name="city"
          value={draft.city}
          onChange={(value) => update("city", value)}
        />
        <TextField
          label={t("bids.fields.stateProvince")}
          name="stateProvince"
          value={draft.stateProvince}
          onChange={(value) => update("stateProvince", value)}
        />
        <TextField
          label={t("bids.fields.postalCode")}
          name="postalCode"
          value={draft.postalCode}
          onChange={(value) => update("postalCode", value)}
        />
        <TextField
          maxLength={2}
          label={t("bids.fields.countryCode")}
          name="countryCode"
          value={draft.countryCode}
          onChange={(value) => update("countryCode", value.toUpperCase())}
        />
      </EditSection>

      <EditSection title={t("bids.sections.schedule")}>
        <TextField
          type="datetime-local"
          label={t("bids.fields.bidDueAt")}
          name="bidDueAt"
          value={draft.bidDueAt}
          onChange={(value) => update("bidDueAt", value)}
        />
        <TextField
          type="datetime-local"
          label={t("bids.fields.rfiDeadlineAt")}
          name="rfiDeadlineAt"
          value={draft.rfiDeadlineAt}
          onChange={(value) => update("rfiDeadlineAt", value)}
        />
        <TextField
          type="datetime-local"
          label={t("bids.fields.preBidMeetingAt")}
          name="preBidMeetingAt"
          value={draft.preBidMeetingAt}
          onChange={(value) => update("preBidMeetingAt", value)}
        />
        <TextField
          type="date"
          label={t("bids.fields.anticipatedStartDate")}
          name="anticipatedStartDate"
          value={draft.anticipatedStartDate}
          onChange={(value) => update("anticipatedStartDate", value)}
        />
        <TextField
          type="date"
          label={t("bids.fields.anticipatedCompletionDate")}
          name="anticipatedCompletionDate"
          value={draft.anticipatedCompletionDate}
          onChange={(value) => update("anticipatedCompletionDate", value)}
        />
      </EditSection>

      <EditSection title={t("bids.sections.contact")}>
        <TextField
          label={t("bids.fields.issuerCompanyName")}
          name="issuerCompanyName"
          value={draft.issuerCompanyName}
          onChange={(value) => update("issuerCompanyName", value)}
        />
        <TextField
          label={t("bids.fields.primaryContactName")}
          name="primaryContactName"
          value={draft.primaryContactName}
          onChange={(value) => update("primaryContactName", value)}
        />
        <TextField
          type="email"
          label={t("bids.fields.primaryContactEmail")}
          name="primaryContactEmail"
          value={draft.primaryContactEmail}
          onChange={(value) => update("primaryContactEmail", value)}
        />
        <TextField
          type="tel"
          label={t("bids.fields.primaryContactPhone")}
          name="primaryContactPhone"
          value={draft.primaryContactPhone}
          onChange={(value) => update("primaryContactPhone", value)}
        />
      </EditSection>

      <EditSection title={t("bids.sections.submission")}>
        <TextField
          label={t("bids.fields.submissionMethod")}
          name="submissionMethod"
          value={draft.submissionMethod}
          onChange={(value) => update("submissionMethod", value)}
        />
        <TextField
          type="email"
          label={t("bids.fields.submissionEmail")}
          name="submissionEmail"
          value={draft.submissionEmail}
          onChange={(value) => update("submissionEmail", value)}
        />
        <TextField
          wide
          type="url"
          label={t("bids.fields.submissionUrl")}
          name="submissionUrl"
          value={draft.submissionUrl}
          onChange={(value) => update("submissionUrl", value)}
        />
        <TextAreaField
          wide
          label={t("bids.fields.submissionInstructions")}
          name="submissionInstructions"
          value={draft.submissionInstructions}
          onChange={(value) => update("submissionInstructions", value)}
        />
      </EditSection>

      <EditSection title={t("bids.sections.ownership")}>
        <Field label={t("bids.fields.assignedToUser")} name="assignedToUserUuid">
          <Select
            value={draft.assignedToUserUuid || UNASSIGNED}
            onValueChange={(value) => update("assignedToUserUuid", value === UNASSIGNED ? "" : value)}
          >
            <SelectTrigger id="assignedToUserUuid">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={UNASSIGNED}>{t("bids.form.unassigned")}</SelectItem>
              {assignedUserMissing && (
                <SelectItem value={draft.assignedToUserUuid}>{draft.assignedToUserUuid}</SelectItem>
              )}
              {tenantUsers.map((user) => (
                <SelectItem key={user.uuid} value={user.uuid}>
                  {user.firstName} {user.lastName} · {user.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label={t("bids.fields.priority")} name="priority">
          <Select value={draft.priority} onValueChange={(value) => update("priority", value as BidPriority)}>
            <SelectTrigger id="priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(BidPriority).map((priority) => (
                <SelectItem key={priority} value={priority}>
                  {t(`bids.priority.${priority}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <TextAreaField
          wide
          label={t("bids.fields.managerNotes")}
          name="managerNotes"
          value={draft.managerNotes}
          onChange={(value) => update("managerNotes", value)}
        />
        <SwitchField
          label={t("bids.fields.autoUpdateEnabled")}
          name="autoUpdateEnabled"
          checked={draft.autoUpdateEnabled}
          onChange={(value) => update("autoUpdateEnabled", value)}
        />
        <SwitchField
          label={t("bids.fields.requiresReview")}
          name="requiresReview"
          checked={draft.requiresReview}
          onChange={(value) => update("requiresReview", value)}
        />
      </EditSection>
    </form>
  );
}

function EditSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">{children}</CardContent>
    </Card>
  );
}

function Field({
  label,
  name,
  description,
  wide = false,
  children,
}: {
  label: string;
  name: string;
  description?: string;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={wide ? "space-y-1.5 sm:col-span-2" : "space-y-1.5"}>
      <Label htmlFor={name}>{label}</Label>
      {children}
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
  );
}

function TextField({
  label,
  name,
  value,
  onChange,
  description,
  type = "text",
  required = false,
  maxLength,
  wide = false,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  description?: string;
  type?: string;
  required?: boolean;
  maxLength?: number;
  wide?: boolean;
}) {
  return (
    <Field label={label} name={name} description={description} wide={wide}>
      <Input
        id={name}
        name={name}
        type={type}
        required={required}
        maxLength={maxLength}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  );
}

function TextAreaField({
  label,
  name,
  value,
  onChange,
  wide = false,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  wide?: boolean;
}) {
  return (
    <Field label={label} name={name} wide={wide}>
      <textarea
        id={name}
        name={name}
        className="border-input bg-background min-h-24 w-full rounded-md border px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  );
}

function SwitchField({
  label,
  name,
  checked,
  onChange,
}: {
  label: string;
  name: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border p-3">
      <Label htmlFor={name}>{label}</Label>
      <Switch id={name} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
