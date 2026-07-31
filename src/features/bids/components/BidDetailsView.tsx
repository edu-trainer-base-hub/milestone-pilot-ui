import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { TenantUserResponse } from "@/features/tenant-users/model/types";
import type { Bid, BidFieldSource } from "../model/types";

interface BidDetailsViewProps {
  bid: Bid;
  tenantUsers: TenantUserResponse[];
}

export function BidDetailsView({ bid, tenantUsers }: BidDetailsViewProps) {
  const { t } = useTranslation();
  const sourceByField = new Map(bid.fieldSources.map((source) => [source.fieldName, source]));
  const assignee = tenantUsers.find((user) => user.uuid === bid.assignedToUserUuid);
  const assigneeLabel = assignee
    ? `${assignee.firstName} ${assignee.lastName} · ${assignee.email}`
    : bid.assignedToUserUuid;

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <DetailsSection title={t("bids.sections.project")}>
        <DetailField
          label={t("bids.fields.projectName")}
          source={sourceByField.get("projectName")}
          value={bid.projectName}
        />
        <DetailField
          label={t("bids.fields.bidPackage")}
          source={sourceByField.get("bidPackage")}
          value={bid.bidPackage}
        />
        <DetailField
          wide
          label={t("bids.fields.projectDescription")}
          source={sourceByField.get("projectDescription")}
          value={<LongText value={bid.projectDescription} />}
        />
        <DetailField
          wide
          label={t("bids.fields.scopeSummary")}
          source={sourceByField.get("scopeSummary")}
          value={<LongText value={bid.scopeSummary} />}
        />
        <DetailField
          wide
          label={t("bids.fields.trades")}
          source={sourceByField.get("trades")}
          value={<TradeBadges trades={bid.trades} />}
        />
      </DetailsSection>

      <DetailsSection title={t("bids.sections.identifiers")}>
        <DetailField
          label={t("bids.fields.projectNumber")}
          source={sourceByField.get("projectNumber")}
          value={bid.projectNumber}
        />
        <DetailField
          label={t("bids.fields.solicitationNumber")}
          source={sourceByField.get("solicitationNumber")}
          value={bid.solicitationNumber}
        />
        <DetailField
          label={t("bids.fields.bidPackageNumber")}
          source={sourceByField.get("bidPackageNumber")}
          value={bid.bidPackageNumber}
        />
        <DetailField
          label={t("bids.fields.externalPlatform")}
          source={sourceByField.get("externalPlatform")}
          value={bid.externalPlatform}
        />
        <DetailField
          wide
          label={t("bids.fields.externalOpportunityId")}
          source={sourceByField.get("externalOpportunityId")}
          value={bid.externalOpportunityId}
        />
      </DetailsSection>

      <DetailsSection title={t("bids.sections.location")}>
        <DetailField label={t("bids.fields.siteName")} source={sourceByField.get("siteName")} value={bid.siteName} />
        <DetailField
          label={t("bids.fields.fullAddress")}
          source={sourceByField.get("fullAddress")}
          value={bid.fullAddress}
        />
        <DetailField
          label={t("bids.fields.addressLine1")}
          source={sourceByField.get("addressLine1")}
          value={bid.addressLine1}
        />
        <DetailField
          label={t("bids.fields.addressLine2")}
          source={sourceByField.get("addressLine2")}
          value={bid.addressLine2}
        />
        <DetailField label={t("bids.fields.city")} source={sourceByField.get("city")} value={bid.city} />
        <DetailField
          label={t("bids.fields.stateProvince")}
          source={sourceByField.get("stateProvince")}
          value={bid.stateProvince}
        />
        <DetailField
          label={t("bids.fields.postalCode")}
          source={sourceByField.get("postalCode")}
          value={bid.postalCode}
        />
        <DetailField
          label={t("bids.fields.countryCode")}
          source={sourceByField.get("countryCode")}
          value={bid.countryCode}
        />
      </DetailsSection>

      <DetailsSection title={t("bids.sections.schedule")}>
        <DetailField
          label={t("bids.fields.bidDueAt")}
          source={sourceByField.get("bidDueAt")}
          value={formatDateTime(bid.bidDueAt)}
        />
        <DetailField
          label={t("bids.fields.rfiDeadlineAt")}
          source={sourceByField.get("rfiDeadlineAt")}
          value={formatDateTime(bid.rfiDeadlineAt)}
        />
        <DetailField
          label={t("bids.fields.preBidMeetingAt")}
          source={sourceByField.get("preBidMeetingAt")}
          value={formatDateTime(bid.preBidMeetingAt)}
        />
        <DetailField
          label={t("bids.fields.anticipatedStartDate")}
          source={sourceByField.get("anticipatedStartDate")}
          value={formatDate(bid.anticipatedStartDate)}
        />
        <DetailField
          label={t("bids.fields.anticipatedCompletionDate")}
          source={sourceByField.get("anticipatedCompletionDate")}
          value={formatDate(bid.anticipatedCompletionDate)}
        />
        <DetailField label={t("bids.fields.awardedAt")} value={formatDateTime(bid.awardedAt)} />
      </DetailsSection>

      <DetailsSection title={t("bids.sections.contact")}>
        <DetailField
          label={t("bids.fields.issuerCompanyName")}
          source={sourceByField.get("issuerCompanyName")}
          value={bid.issuerCompanyName}
        />
        <DetailField
          label={t("bids.fields.primaryContactName")}
          source={sourceByField.get("primaryContactName")}
          value={bid.primaryContactName}
        />
        <DetailField
          label={t("bids.fields.primaryContactEmail")}
          source={sourceByField.get("primaryContactEmail")}
          value={<EmailLink value={bid.primaryContactEmail} />}
        />
        <DetailField
          label={t("bids.fields.primaryContactPhone")}
          source={sourceByField.get("primaryContactPhone")}
          value={<PhoneLink value={bid.primaryContactPhone} />}
        />
      </DetailsSection>

      <DetailsSection title={t("bids.sections.submission")}>
        <DetailField
          label={t("bids.fields.submissionMethod")}
          source={sourceByField.get("submissionMethod")}
          value={bid.submissionMethod}
        />
        <DetailField
          label={t("bids.fields.submissionEmail")}
          source={sourceByField.get("submissionEmail")}
          value={<EmailLink value={bid.submissionEmail} />}
        />
        <DetailField
          wide
          label={t("bids.fields.submissionUrl")}
          source={sourceByField.get("submissionUrl")}
          value={<ExternalLink value={bid.submissionUrl} />}
        />
        <DetailField
          wide
          label={t("bids.fields.submissionInstructions")}
          source={sourceByField.get("submissionInstructions")}
          value={<LongText value={bid.submissionInstructions} />}
        />
      </DetailsSection>

      <DetailsSection title={t("bids.sections.ownership")}>
        <DetailField
          label={t("bids.fields.assignedToUser")}
          source={sourceByField.get("assignedToUserUuid")}
          value={assigneeLabel}
        />
        <DetailField
          label={t("bids.fields.priority")}
          source={sourceByField.get("priority")}
          value={<Badge variant="outline">{t(`bids.priority.${bid.priority}`)}</Badge>}
        />
        <DetailField
          label={t("bids.fields.status")}
          source={sourceByField.get("status")}
          value={<Badge variant="outline">{t(`bids.status.${bid.status}`)}</Badge>}
        />
        <DetailField
          label={t("bids.fields.reviewStatus")}
          value={<Badge variant="outline">{t(`bids.review.${bid.reviewStatus}`)}</Badge>}
        />
        <DetailField
          label={t("bids.fields.autoUpdateEnabled")}
          source={sourceByField.get("autoUpdateEnabled")}
          value={t(`common.boolean.${bid.autoUpdateEnabled ? "yes" : "no"}`)}
        />
        <DetailField
          label={t("bids.fields.requiresReview")}
          source={sourceByField.get("requiresReview")}
          value={t(`common.boolean.${bid.requiresReview ? "yes" : "no"}`)}
        />
        <DetailField
          wide
          label={t("bids.fields.managerNotes")}
          source={sourceByField.get("managerNotes")}
          value={<LongText value={bid.managerNotes} />}
        />
      </DetailsSection>

      <DetailsSection title={t("bids.sections.system")}>
        <DetailField label={t("bids.fields.uuid")} value={<CodeValue value={bid.uuid} />} />
        <DetailField label={t("bids.fields.version")} value={String(bid.version)} />
        <DetailField
          label={t("bids.fields.lastSourceEmailUuid")}
          value={<CodeValue value={bid.lastSourceEmailUuid} />}
        />
        <DetailField label={t("bids.fields.lastEmailReceivedAt")} value={formatDateTime(bid.lastEmailReceivedAt)} />
        <DetailField label={t("bids.fields.lastAutoUpdatedAt")} value={formatDateTime(bid.lastAutoUpdatedAt)} />
        <DetailField label={t("bids.fields.createdAt")} value={formatDateTime(bid.createdAt)} />
        <DetailField label={t("bids.fields.updatedAt")} value={formatDateTime(bid.updatedAt)} />
      </DetailsSection>
    </div>
  );
}

function DetailsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2">{children}</dl>
      </CardContent>
    </Card>
  );
}

function DetailField({
  label,
  value,
  source,
  wide = false,
}: {
  label: string;
  value: ReactNode;
  source?: BidFieldSource;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "space-y-1.5 sm:col-span-2" : "space-y-1.5"}>
      <div className="flex min-h-5 items-center justify-between gap-2">
        <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</dt>
        {source && <ProvenanceBadge source={source} />}
      </div>
      <dd className="min-w-0 text-sm">{hasValue(value) ? value : "—"}</dd>
    </div>
  );
}

function ProvenanceBadge({ source }: { source: BidFieldSource }) {
  const { t } = useTranslation();
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="outline" className="cursor-help text-[10px]" tabIndex={0}>
          {t(`bids.sourceType.${source.sourceType}`)}
        </Badge>
      </TooltipTrigger>
      <TooltipContent className="max-w-sm space-y-1">
        <div>{t(`bids.sourceType.${source.sourceType}`)}</div>
        <div>
          {t("bids.provenance.manualOverride")}: {t(`common.boolean.${source.manuallyOverridden ? "yes" : "no"}`)}
        </div>
        <ProvenanceLine label={t("bids.provenance.sourceEmail")} value={source.sourceEmailUuid} />
        <ProvenanceLine label={t("bids.provenance.parsingRun")} value={source.parsingRunUuid} />
        <ProvenanceLine label={t("bids.provenance.updateRequest")} value={source.updateRequestUuid} />
        <ProvenanceLine label={t("bids.provenance.acceptedBy")} value={source.acceptedByUserUuid} />
        <ProvenanceLine label={t("bids.provenance.acceptedAt")} value={formatDateTime(source.acceptedAt)} />
      </TooltipContent>
    </Tooltip>
  );
}

function ProvenanceLine({ label, value }: { label: string; value: string | null }) {
  return value ? (
    <div>
      {label}: {value}
    </div>
  ) : null;
}

function TradeBadges({ trades }: { trades: string[] }) {
  return trades.length ? (
    <div className="flex flex-wrap gap-2">
      {trades.map((trade) => (
        <Badge key={trade} variant="secondary">
          {trade}
        </Badge>
      ))}
    </div>
  ) : (
    "—"
  );
}

function LongText({ value }: { value: string | null }) {
  return value ? <span className="whitespace-pre-wrap">{value}</span> : "—";
}

function EmailLink({ value }: { value: string | null }) {
  return value ? (
    <a className="break-all text-primary hover:underline" href={`mailto:${value}`}>
      {value}
    </a>
  ) : (
    "—"
  );
}

function PhoneLink({ value }: { value: string | null }) {
  return value ? (
    <a className="text-primary hover:underline" href={`tel:${value}`}>
      {value}
    </a>
  ) : (
    "—"
  );
}

function ExternalLink({ value }: { value: string | null }) {
  if (!value) return "—";
  const href = safeExternalUrl(value);
  return href ? (
    <a className="break-all text-primary hover:underline" href={href} target="_blank" rel="noreferrer">
      {value}
    </a>
  ) : (
    value
  );
}

function CodeValue({ value }: { value: string | null }) {
  return value ? <code className="break-all text-xs">{value}</code> : "—";
}

function formatDateTime(value: string | null): string | null {
  return value ? new Date(value).toLocaleString() : null;
}

function formatDate(value: string | null): string | null {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString();
}

function safeExternalUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function hasValue(value: ReactNode): boolean {
  return value !== null && value !== undefined && value !== "";
}
