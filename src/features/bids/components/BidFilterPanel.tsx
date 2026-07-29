import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getSelectedBidTags, getSelectedBidUsers, searchBidTags, searchBidUsers } from "../api/bids";
import { OpportunitySource, type BidTag, type BidUserSummary } from "../model/types";
import { centsToDecimal, parseMoneyToCents } from "../model/money";
import { BidLookup } from "./BidLookup";
import { fields, filterKeys, countActiveFilters } from "../model/filter-keys";

export function BidFilterPanel({
  params,
  onApply,
}: {
  params: URLSearchParams;
  onApply: (params: URLSearchParams) => void;
}) {
  const { t, i18n } = useTranslation();
  const { principal } = useAuth();
  const [draft, setDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      fields.map((field) => [
        field,
        field.startsWith("estimate") ? centsToDecimal(params.get(field)) : (params.get(field) ?? ""),
      ])
    )
  );
  const [tags, setTags] = useState<BidTag[]>(() =>
    (params.get("tagUuids")?.split(",").filter(Boolean) ?? []).map((uuid) => ({ uuid, name: "" }))
  );
  const [tagMatch, setTagMatch] = useState(params.get("tagMatch") ?? "ANY");
  const [users, setUsers] = useState<Record<string, BidUserSummary[]>>(() =>
    Object.fromEntries(
      ["projectManagerUserUuid", "estimatorUserUuid", "assignedUserUuid"].map((key) => [
        key,
        params.get(key) ? [{ uuid: params.get(key)!, displayName: "", active: true }] : [],
      ])
    )
  );
  const tagIds = tags.map((tag) => tag.uuid);
  const userIds = [
    ...new Set(
      Object.values(users)
        .flat()
        .map((user) => user.uuid)
    ),
  ];
  const tagProfiles = useQuery({
    queryKey: ["bid-filter-tags", principal?.activeTenantUuid, tagIds],
    queryFn: () => getSelectedBidTags(tagIds),
    enabled: tags.some((tag) => !tag.name),
  });
  const userProfiles = useQuery({
    queryKey: ["bid-filter-users", principal?.activeTenantUuid, userIds],
    queryFn: () => getSelectedBidUsers(userIds),
    enabled: Object.values(users)
      .flat()
      .some((user) => !user.displayName),
  });
  const tagValues = tags.map((tag) => tagProfiles.data?.items.find((item) => item.uuid === tag.uuid) ?? tag);
  const userValues = (key: string) =>
    users[key].map((user) => userProfiles.data?.items.find((item) => item.uuid === user.uuid) ?? user);
  const [sources, setSources] = useState(() => params.get("opportunitySources")?.split(",").filter(Boolean) ?? []);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const activeCount = countActiveFilters(params);
  const apply = () => {
    const next = new URLSearchParams(params);
    filterKeys.forEach((key) => next.delete(key));
    try {
      for (const field of fields) {
        let value = draft[field].trim();
        if (field.startsWith("estimate"))
          value = parseMoneyToCents(value, i18n.resolvedLanguage ?? i18n.language) ?? "";
        if (field.startsWith("distance") && value) {
          if (!/^\d{1,8}([.,]\d{1,2})?$/.test(value)) throw new Error("invalidDistance");
          value = value.replace(",", ".");
        }
        if (value) next.set(field, value);
      }
      const fromDate = next.get("bidSubmittedFrom"),
        toDate = next.get("bidSubmittedTo");
      const min = next.get("estimateMinCents"),
        max = next.get("estimateMaxCents");
      const distanceFrom = next.get("distanceFromMiles"),
        distanceTo = next.get("distanceToMiles");
      if (
        (fromDate && toDate && fromDate > toDate) ||
        (min && max && BigInt(min) > BigInt(max)) ||
        (distanceFrom && distanceTo && Number(distanceFrom) > Number(distanceTo))
      )
        throw new Error("invalidFilterRange");
      if (tags.length) {
        next.set("tagUuids", tags.map((tag) => tag.uuid).join(","));
        next.set("tagMatch", tagMatch);
      }
      for (const [key, selected] of Object.entries(users)) if (selected[0]) next.set(key, selected[0].uuid);
      if (sources.length) next.set("opportunitySources", sources.join(","));
      next.set("page", "0");
      onApply(next);
      setOpen(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : "invalidFilterRange");
    }
  };
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="relative"
          aria-label={t("bids.filters.advanced")}
          title={t("bids.filters.advanced")}
        >
          <SlidersHorizontal className="size-4" />
          {activeCount > 0 && (
            <span
              data-testid="active-filter-count"
              className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground"
            >
              {activeCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="max-h-[75vh] w-[min(42rem,calc(100vw-2rem))] overflow-y-auto p-0">
        <div className="grid gap-4 p-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="filter-tags">{t("bids.fields.tags")}</Label>
            <BidLookup
              id="filter-tags"
              label={t("bids.fields.tags")}
              kind="tags"
              multiple
              values={tagValues}
              load={searchBidTags}
              optionLabel={(tag) => tag.name || t("bids.form.selectedTag")}
              onChange={setTags}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="filter-tagMatch">{t("bids.filters.tagMatch")}</Label>
            <Select value={tagMatch} onValueChange={setTagMatch}>
              <SelectTrigger id="filter-tagMatch">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ANY">{t("bids.filters.anyTag")}</SelectItem>
                <SelectItem value="ALL">{t("bids.filters.allTags")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(["projectManagerUserUuid", "estimatorUserUuid", "assignedUserUuid"] as const).map((key) => (
            <div key={key} className="space-y-1">
              <Label htmlFor={`filter-${key}`}>{t(`bids.fields.${key}`)}</Label>
              <BidLookup
                id={`filter-${key}`}
                label={t(`bids.fields.${key}`)}
                kind="users"
                values={userValues(key)}
                load={searchBidUsers}
                optionLabel={(user) => user.displayName || t("bids.form.selectedUser")}
                onChange={(values) => setUsers({ ...users, [key]: values })}
              />
            </div>
          ))}
          {fields.map((field) => (
            <div key={field} className="space-y-1">
              <Label htmlFor={`filter-${field}`}>{t(`bids.filters.${field}`)}</Label>
              <Input
                id={`filter-${field}`}
                type={field.startsWith("bidSubmitted") ? "date" : "text"}
                inputMode={field.startsWith("estimate") || field.startsWith("distance") ? "decimal" : undefined}
                value={draft[field]}
                onChange={(event) => setDraft({ ...draft, [field]: event.target.value })}
              />
            </div>
          ))}
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">{t("bids.fields.opportunitySource")}</legend>
            <div className="flex flex-wrap gap-3">
              {Object.values(OpportunitySource).map((source) => (
                <label key={source} className="flex items-center gap-1 text-sm">
                  <input
                    type="checkbox"
                    checked={sources.includes(source)}
                    onChange={(event) =>
                      setSources(
                        event.target.checked ? [...sources, source] : sources.filter((value) => value !== source)
                      )
                    }
                  />
                  {source}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
        {error && (
          <p role="alert" className="px-4 pb-2 text-sm text-destructive">
            {t(`bids.form.${error}`)}
          </p>
        )}
        <div className="sticky bottom-0 flex gap-2 border-t bg-popover p-3">
          <Button type="button" onClick={apply}>
            {t("bids.filters.apply")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const next = new URLSearchParams(params);
              filterKeys.forEach((key) => next.delete(key));
              next.set("page", "0");
              onApply(next);
              setOpen(false);
            }}
          >
            {t("bids.filters.clear")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
