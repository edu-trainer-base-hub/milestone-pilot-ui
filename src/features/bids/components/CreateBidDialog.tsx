import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { notifier } from "@/services/NotificationService";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { BidEditForm } from "./BidEditForm";
import { bidDraftErrors, bidToEditDraft, buildBidCreateInput } from "../model/bid-edit";
import { createBid } from "../api/bids";

export function CreateBidDialog() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(() => bidToEditDraft({}));
  const language = i18n.resolvedLanguage ?? i18n.language;

  const createMutation = useMutation({
    mutationFn: createBid,
    onSuccess: (bid) => {
      notifier.success(t("bids.notifications.created"));
      setOpen(false);
      setDraft(bidToEditDraft({}));
      void queryClient.invalidateQueries({ queryKey: ["bids"] });
      void queryClient.invalidateQueries({ queryKey: ["bid-dashboard"] });
      window.location.assign(`/tenant/bids/${bid.uuid}`);
    },
    onError: () => notifier.error(t("bids.notifications.createError")),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" aria-label={t("bids.create")} title={t("bids.create")}>
          <Plus className="size-4" />
          <span className="hidden sm:inline">{t("bids.create")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{t("bids.create")}</DialogTitle>
          <DialogDescription>{t("bids.createDescription")}</DialogDescription>
        </DialogHeader>
        <BidEditForm
          creating
          formId="bid-create-form"
          draft={draft}
          onChange={setDraft}
          onSubmit={() => createMutation.mutate(buildBidCreateInput(draft, language))}
        />
        <DialogFooter>
          <Button
            type="submit"
            form="bid-create-form"
            disabled={
              !draft.projectName.trim() || createMutation.isPending || bidDraftErrors(draft, language).length > 0
            }
          >
            {t("common.create", "Create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
