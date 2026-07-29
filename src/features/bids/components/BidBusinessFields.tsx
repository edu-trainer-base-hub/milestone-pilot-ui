import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createBidTag, searchBidTags, searchBidUsers } from "../api/bids";
import { bidDraftErrors, type BidEditDraft } from "../model/bid-edit";
import { OpportunitySource, type BidUserSummary } from "../model/types";
import { BidLookup } from "./BidLookup";

export function BidBusinessFields({
  draft,
  onChange,
}: {
  draft: BidEditDraft;
  onChange: (draft: BidEditDraft) => void;
}) {
  const { t, i18n } = useTranslation();
  const update = <K extends keyof BidEditDraft>(key: K, value: BidEditDraft[K]) => onChange({ ...draft, [key]: value });
  const userLabel = (user: BidUserSummary) =>
    `${user.displayName}${user.active ? "" : ` (${t("bids.form.inactive")})`}`;
  const errors = bidDraftErrors(draft, i18n.resolvedLanguage ?? i18n.language);
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1 sm:col-span-2">
        <Label htmlFor="bid-tags">{t("bids.fields.tags")}</Label>
        <BidLookup
          id="bid-tags"
          label={t("bids.fields.tags")}
          kind="tags"
          multiple
          values={draft.tags}
          load={searchBidTags}
          optionLabel={(tag) => tag.name}
          createOption={createBidTag}
          onChange={(values) => update("tags", values)}
        />
      </div>
      {(["projectManager", "estimator"] as const).map((field) => (
        <div key={field} className="space-y-1">
          <Label htmlFor={`bid-${field}`}>{t(`bids.fields.${field}`)}</Label>
          <BidLookup
            id={`bid-${field}`}
            label={t(`bids.fields.${field}`)}
            kind="users"
            values={draft[field] ? [draft[field]] : []}
            load={searchBidUsers}
            optionLabel={userLabel}
            onChange={(values) => update(field, values[0] ?? null)}
          />
        </div>
      ))}
      <div className="space-y-1 sm:col-span-2">
        <Label htmlFor="bid-assignedUsers">{t("bids.fields.assignedUsers")}</Label>
        <BidLookup
          id="bid-assignedUsers"
          label={t("bids.fields.assignedUsers")}
          kind="users"
          multiple
          values={draft.assignedUsers}
          load={searchBidUsers}
          optionLabel={userLabel}
          onChange={(values) => update("assignedUsers", values)}
        />
      </div>
      {(["division", "bidSubmittedDate", "distanceMinMiles", "distanceMaxMiles", "estimateValue"] as const).map(
        (field) => (
          <div key={field} className="space-y-1">
            <Label htmlFor={`bid-${field}`}>{t(`bids.fields.${field}`)}</Label>
            <Input
              id={`bid-${field}`}
              type={field === "bidSubmittedDate" ? "date" : "text"}
              inputMode={field === "estimateValue" || field.startsWith("distance") ? "decimal" : undefined}
              value={draft[field]}
              onChange={(event) => update(field, event.target.value)}
            />
          </div>
        )
      )}
      <div className="space-y-1">
        <Label htmlFor="bid-opportunitySource">{t("bids.fields.opportunitySource")}</Label>
        <Select
          value={draft.opportunitySource || "UNSET"}
          onValueChange={(value) => update("opportunitySource", value === "UNSET" ? "" : (value as OpportunitySource))}
        >
          <SelectTrigger id="bid-opportunitySource">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="UNSET">{t("bids.form.unassigned")}</SelectItem>
            {Object.values(OpportunitySource).map((source) => (
              <SelectItem key={source} value={source}>
                {source}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1 sm:col-span-2">
        <Label htmlFor="bid-relatedLinks">{t("bids.fields.relatedLinks")}</Label>
        <textarea
          id="bid-relatedLinks"
          rows={4}
          className="w-full rounded-md border bg-transparent px-3 py-2 text-sm"
          value={draft.relatedLinks}
          onChange={(event) => update("relatedLinks", event.target.value)}
        />
      </div>
      {errors.length > 0 && (
        <div role="alert" className="space-y-1 text-sm text-destructive sm:col-span-2">
          {errors.map((error) => (
            <p key={error}>{t(`bids.form.${error}`)}</p>
          ))}
        </div>
      )}
    </div>
  );
}
