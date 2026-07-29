import { useEffect, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { notifier } from "@/services/NotificationService";
import type { LookupPage } from "../model/types";

type Option = { uuid: string };
interface BidLookupProps<T extends Option> {
  id: string;
  label: string;
  kind: "tags" | "users";
  values: T[];
  multiple?: boolean;
  load: (search: string, page: number) => Promise<LookupPage<T>>;
  optionLabel: (option: T) => string;
  onChange: (values: T[]) => void;
  createOption?: (name: string) => Promise<T>;
}

export function BidLookup<T extends Option>({
  id,
  label,
  kind,
  values,
  multiple = false,
  load,
  optionLabel,
  onChange,
  createOption,
}: BidLookupProps<T>) {
  const { t } = useTranslation();
  const { principal } = useAuth();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [creating, setCreating] = useState(false);
  useEffect(() => {
    const timeout = window.setTimeout(() => setDebounced(search.trim()), 350);
    return () => window.clearTimeout(timeout);
  }, [search]);
  const query = useInfiniteQuery({
    queryKey: ["bid-options", principal?.activeTenantUuid, kind, debounced],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => load(debounced, pageParam),
    getNextPageParam: (last) => ((last.page + 1) * last.size < last.totalElements ? last.page + 1 : undefined),
    enabled: open,
  });
  const options = query.data?.pages.flatMap((page) => page.items) ?? [];
  const select = (option: T) => {
    if (multiple)
      onChange(
        values.some((value) => value.uuid === option.uuid)
          ? values.filter((value) => value.uuid !== option.uuid)
          : [...values, option]
      );
    else {
      onChange([option]);
      setOpen(false);
    }
  };
  const create = async () => {
    if (!createOption || creating) return;
    setCreating(true);
    try {
      const option = await createOption(search.trim());
      if (!values.some((value) => value.uuid === option.uuid)) onChange([...values, option]);
      void query.refetch();
      setSearch("");
    } catch {
      notifier.error(t("bids.form.tagCreateError"));
    } finally {
      setCreating(false);
    }
  };
  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            type="button"
            role="combobox"
            aria-label={label}
            aria-expanded={open}
            className="w-full justify-between font-normal"
            disabled={creating}
          >
            <span className="truncate">
              {values.length ? values.map(optionLabel).join(", ") : t("bids.form.select")}
            </span>
            <ChevronsUpDown className="ml-2 size-4 shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-64 p-0" align="start">
          <Command shouldFilter={false} label={t("bids.form.searchOptions", { label })}>
            <CommandInput
              aria-label={t("bids.form.searchOptions", { label })}
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>
                {query.isFetching ? t("common.loading", "Loading…") : t("bids.form.noOptions")}
              </CommandEmpty>
              {options.map((option) => (
                <CommandItem key={option.uuid} value={option.uuid} onSelect={() => select(option)}>
                  <Check
                    className={`mr-2 size-4 ${values.some((value) => value.uuid === option.uuid) ? "opacity-100" : "opacity-0"}`}
                  />
                  {optionLabel(option)}
                </CommandItem>
              ))}
              {query.isError && (
                <CommandItem onSelect={() => void query.refetch()}>{t("bids.form.retryOptions")}</CommandItem>
              )}
              {query.hasNextPage && (
                <CommandItem disabled={query.isFetchingNextPage} onSelect={() => void query.fetchNextPage()}>
                  {t("bids.form.loadMore")}
                </CommandItem>
              )}
              {createOption &&
                search.trim() &&
                search.trim().length <= 100 &&
                !options.some((option) => optionLabel(option).toLowerCase() === search.trim().toLowerCase()) && (
                  <CommandItem disabled={creating} onSelect={() => void create()}>
                    {t("bids.form.createTag", { name: search.trim() })}
                  </CommandItem>
                )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <div className="flex flex-wrap gap-1">
        {values.map((value) => (
          <Badge key={value.uuid} variant="secondary">
            {optionLabel(value)}
            <button
              type="button"
              className="ml-1 rounded-sm p-0.5"
              aria-label={t("bids.form.removeOption", { name: optionLabel(value) })}
              onClick={() => onChange(values.filter((selected) => selected.uuid !== value.uuid))}
              disabled={creating}
            >
              <X className="size-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
}
