import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Check, Loader2, Repeat2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { notifier } from "@/services/NotificationService";
import { getCurrentUserTenantMemberships, setDefaultTenant } from "../api";
import { formatRoleLabel, getTenantMembershipId, getTenantMembershipName, isDefaultTenantMembership } from "../types";
import type { TenantMembership } from "../types";

const TENANT_MEMBERSHIPS_QUERY_KEY = ["tenantMemberships"] as const;

const isMembershipActive = (
  membership: TenantMembership,
  activeTenantId: string | null,
  activeTenantUuid: string | null
) =>
  Boolean(
    (activeTenantId && membership.tenantId === activeTenantId) ||
      (activeTenantUuid && membership.tenantUuid === activeTenantUuid)
  );

export const TenantMembershipsPage = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { principal, doRefresh } = useAuth();

  const {
    data: memberships = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: TENANT_MEMBERSHIPS_QUERY_KEY,
    queryFn: getCurrentUserTenantMemberships,
  });

  const switchTenantMutation = useMutation({
    mutationFn: async (membership: TenantMembership) => {
      const targetTenantId = getTenantMembershipId(membership);

      if (!targetTenantId) {
        throw new Error("Tenant identifier is missing");
      }

      await setDefaultTenant(targetTenantId);
      await doRefresh();
      await queryClient.invalidateQueries();
    },
    onSuccess: () => {
      notifier.success(t("pages.tenantMemberships.notifications.switchSuccess"));
    },
    onError: () => {
      notifier.error(t("pages.tenantMemberships.notifications.switchError"));
    },
  });

  return (
    <div className="bg-background py-0 px-0 sm:py-8 sm:px-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-foreground">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>{t("pages.tenantMemberships.title")}</CardTitle>
              <CardDescription>{t("pages.tenantMemberships.description")}</CardDescription>
            </div>
          </div>
          {principal?.activeTenantName && (
            <div className="text-sm text-muted-foreground">
              {t("pages.tenantMemberships.currentTenantLabel")}{" "}
              <span className="font-medium text-foreground">{principal.activeTenantName}</span>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              {t("common.loading")}
            </div>
          ) : isError ? (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-6 text-center text-destructive">
              {t("pages.tenantMemberships.loadError")}
            </div>
          ) : memberships.length === 0 ? (
            <div className="rounded-lg border border-dashed px-4 py-8 text-center text-muted-foreground">
              {t("pages.tenantMemberships.empty")}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("pages.tenantMemberships.columns.tenant")}</TableHead>
                    <TableHead>{t("pages.tenantMemberships.columns.role")}</TableHead>
                    <TableHead>{t("pages.tenantMemberships.columns.status")}</TableHead>
                    <TableHead className="text-right">{t("common.list.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {memberships.map((membership) => {
                    const active = isMembershipActive(
                      membership,
                      principal?.activeTenantId ?? null,
                      principal?.activeTenantUuid ?? null
                    );
                    const switchLabel = active
                      ? t("pages.tenantMemberships.actions.active")
                      : t("pages.tenantMemberships.actions.switch");

                    return (
                      <TableRow
                        key={`${membership.tenantId ?? membership.tenantUuid ?? membership.tenantName}-${membership.role}`}
                      >
                        <TableCell className="font-medium">{getTenantMembershipName(membership)}</TableCell>
                        <TableCell>{formatRoleLabel(membership.role)}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            {active && (
                              <Badge variant="secondary">
                                <Check className="h-3 w-3" />
                                {t("pages.tenantMemberships.badges.active")}
                              </Badge>
                            )}
                            {isDefaultTenantMembership(membership) && (
                              <Badge variant="outline">{t("pages.tenantMemberships.badges.default")}</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => switchTenantMutation.mutate(membership)}
                            disabled={active || switchTenantMutation.isPending}
                            aria-label={`${switchLabel} ${getTenantMembershipName(membership)}`}
                          >
                            {switchTenantMutation.isPending ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Repeat2 className="mr-2 h-4 w-4" />
                            )}
                            {switchLabel}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="flex justify-end">
            <Button asChild variant="ghost">
              <Link to="/settings">{t("pages.tenantMemberships.actions.backToSettings")}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TenantMembershipsPage;
