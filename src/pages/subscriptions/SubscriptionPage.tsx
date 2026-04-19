import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

import { notifier } from "@/services/NotificationService";
import { extractErrorCode } from "@/services/ApiService";
import SubscriptionsApiClient, {
  type EntitlementsResponse,
  type RedeemRequest,
} from "@/services/SubscriptionsApiClient";
import { useAuth } from "@/contexts/AuthContext.tsx";

export default function SubscriptionPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const { doRefresh } = useAuth();

  const [loadingEntitlements, setLoadingEntitlements] = useState(false);
  const [entitlements, setEntitlements] = useState<EntitlementsResponse | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [generateClicked, setGenerateClicked] = useState(false);
  const [inlineMsg, setInlineMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Prefill from ?code=...
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get("code");
    if (code) {
      setPromoCode(code);
      // Focus the input for quick submit
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [location.search]);

  useEffect(() => {
    void loadEntitlements();
  }, []);

  async function loadEntitlements() {
    setLoadingEntitlements(true);
    setInlineMsg(null);
    try {
      const data = await SubscriptionsApiClient.fetchEntitlements();
      setEntitlements(data);
    } catch (err) {
      const errorCode = extractErrorCode(err);
      const msgKey = errorCode ? `errors.codes.${errorCode}` : "errors.codes.UNKNOWN";
      notifier.error(t(msgKey, { defaultValue: t("errors.codes.UNKNOWN") }));
    } finally {
      setLoadingEntitlements(false);
    }
  }

  const isActive = useMemo(() => {
    if (!entitlements?.endsAt) return false;
    return entitlements.endsAt.getTime() > Date.now();
  }, [entitlements]);

  const canRequestPromo = useMemo(() => {
    if (!entitlements) return false;
    if (entitlements.planName === "FREE_TIER") return true;
    const endsAt = entitlements.endsAt;
    if (!endsAt) return false;
    const now = Date.now();
    const tenDaysMs = 10 * 24 * 60 * 60 * 1000;
    const endsAtMs = endsAt.getTime();
    return endsAtMs >= now && endsAtMs <= now + tenDaysMs;
  }, [entitlements]);

  function formatLocal(dt?: Date) {
    if (!dt) return t("pages.subscriptionPage.info.noDate");
    return dt.toLocaleString(); // Local timezone representation. :contentReference[oaicite:3]{index=3}
  }

  function formatUTC(dt?: Date) {
    if (!dt) return t("pages.subscriptionPage.info.noDate");
    return dt.toLocaleString(undefined, {
      timeZone: "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }); // Localized string but forced to UTC. :contentReference[oaicite:4]{index=4}
  }

  async function handleGenerate() {
    if (generateClicked) return;
    setGenerateClicked(true);
    setGenerateLoading(true);
    setInlineMsg(null);
    try {
      await SubscriptionsApiClient.generatePromoCode();
      notifier.success(t("pages.subscriptionPage.notifications.generate.success"));
      setInlineMsg(t("pages.subscriptionPage.notifications.generate.infoEmail"));
    } catch (err) {
      const errorCode = extractErrorCode(err);
      const msgKey = errorCode ? `errors.codes.${errorCode}` : "errors.codes.UNKNOWN";
      notifier.error(t(msgKey, { defaultValue: t("errors.codes.UNKNOWN") }));
      setInlineMsg(t("pages.subscriptionPage.notifications.generate.error"));
    } finally {
      setGenerateLoading(false);
    }
  }

  async function handleRedeem() {
    if (!promoCode || redeemLoading) return;
    setRedeemLoading(true);
    setInlineMsg(null);
    try {
      const req: RedeemRequest = { promoCode: promoCode.trim() };
      const res = await SubscriptionsApiClient.redeemPromoCode(req);
      notifier.success(
        t("pages.subscriptionPage.notifications.redeem.success", {
          until: res.endsAt.toString(),
        })
      );
      setPromoCode("");
      await loadEntitlements();
      await doRefresh();
      setInlineMsg(t("pages.subscriptionPage.notifications.redeem.activated"));
    } catch (err) {
      const errorCode = extractErrorCode(err);
      const msgKey = errorCode ? `errors.codes.${errorCode}` : "errors.codes.UNKNOWN";
      notifier.error(t(msgKey, { defaultValue: t("errors.codes.UNKNOWN") }));
      setInlineMsg(t("pages.subscriptionPage.notifications.redeem.error"));
    } finally {
      setRedeemLoading(false);
    }
  }

  return (
    <div className="bg-background py-0 px-0 sm:py-8 sm:px-4">
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">{t("pages.subscriptionPage.title")}</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Top info block */}
          <section className="rounded-lg border p-4">
            {loadingEntitlements && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{t("pages.subscriptionPage.info.loading")}</span>
              </div>
            )}

            {!loadingEntitlements && (
              <div className="space-y-2">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm text-muted-foreground">{t("pages.subscriptionPage.info.currentPlan")}</span>
                  <span className="font-medium">
                    {entitlements?.planName
                      ? t(`pages.subscriptionPage.plan.names.${entitlements.planName}`, {
                          defaultValue: entitlements.planName,
                        })
                      : t("pages.subscriptionPage.info.none")}
                  </span>
                </div>

                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm text-muted-foreground">
                    {t("pages.subscriptionPage.info.activeUntilLocal")}
                  </span>
                  <span className="font-medium">{formatLocal(entitlements?.endsAt)}</span>
                </div>

                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm text-muted-foreground">
                    {t("pages.subscriptionPage.info.activeUntilUTC")}
                  </span>
                  <span className="font-medium">{formatUTC(entitlements?.endsAt)}</span>
                </div>

                {!isActive && (
                  <Alert className="mt-2">
                    <AlertDescription>{t("pages.subscriptionPage.info.inactiveHint")}</AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </section>

          {/* Actions */}
          <section className="space-y-4">
            {/* Generate promo code */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                type="button"
                onClick={handleGenerate}
                disabled={generateLoading || !canRequestPromo || generateClicked}
                className="w-full sm:w-auto"
              >
                {generateLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {generateLoading
                  ? t("pages.subscriptionPage.buttons.generate.loading")
                  : t("pages.subscriptionPage.buttons.generate.default")}
              </Button>
            </div>

            {/* Redeem */}
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
              <div className="space-y-1">
                <Label htmlFor="promoCode">{t("pages.subscriptionPage.inputs.promoCode.label")}</Label>
                <Input
                  id="promoCode"
                  ref={inputRef}
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder={t("pages.subscriptionPage.inputs.promoCode.placeholder")}
                  disabled={redeemLoading}
                  autoComplete="one-time-code"
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  onClick={handleRedeem}
                  disabled={redeemLoading || !promoCode.trim()}
                  className="w-full sm:w-auto"
                >
                  {redeemLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {redeemLoading
                    ? t("pages.subscriptionPage.buttons.redeem.loading")
                    : t("pages.subscriptionPage.buttons.redeem.default")}
                </Button>
              </div>
            </div>

            {inlineMsg && (
              <Alert>
                <AlertDescription>{inlineMsg}</AlertDescription>
              </Alert>
            )}
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
