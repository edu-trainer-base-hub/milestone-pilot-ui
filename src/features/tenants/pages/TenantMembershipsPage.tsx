import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Check, Loader2, Repeat2, Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { notifier } from "@/services/NotificationService";
import { getCurrentUserWorkspaces, setDefaultWorkspace } from "../api";
import {
  formatRoleLabel,
  getWorkspaceKey,
  getWorkspaceLabel,
  getWorkspaceTenantUuid,
  isDefaultWorkspace,
  isPlatformWorkspace,
  type Workspace,
  WorkspaceContextType,
} from "../types";

const WORKSPACES_QUERY_KEY = ["workspaces"] as const;

const isWorkspaceActive = (workspace: Workspace, contextType: WorkspaceContextType, activeTenantUuid: string | null) =>
  workspace.contextType === WorkspaceContextType.PLATFORM
    ? contextType === WorkspaceContextType.PLATFORM
    : workspace.tenantUuid === activeTenantUuid;

const getWorkspaceDisplayName = (workspace: Workspace, platformLabel: string) =>
  isPlatformWorkspace(workspace) ? platformLabel : getWorkspaceLabel(workspace);

export const TenantMembershipsPage = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { principal, switchWorkspace, doRefresh } = useAuth();

  const {
    data: workspaces = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: WORKSPACES_QUERY_KEY,
    queryFn: getCurrentUserWorkspaces,
  });

  const switchWorkspaceMutation = useMutation({
    mutationFn: async (workspace: Workspace) => {
      await switchWorkspace(workspace.contextType, getWorkspaceTenantUuid(workspace));
      await queryClient.invalidateQueries();
    },
    onSuccess: async () => {
      notifier.success(t("pages.tenantMemberships.notifications.switchSuccess"));
      await navigate("/");
    },
    onError: () => {
      notifier.error(t("pages.tenantMemberships.notifications.switchError"));
    },
  });

  const setDefaultWorkspaceMutation = useMutation({
    mutationFn: async (workspace: Workspace) => {
      await setDefaultWorkspace({
        contextType: workspace.contextType,
        tenantUuid: getWorkspaceTenantUuid(workspace),
      });
      await doRefresh();
      await queryClient.invalidateQueries({ queryKey: WORKSPACES_QUERY_KEY });
    },
    onSuccess: () => {
      notifier.success(t("pages.tenantMemberships.notifications.defaultSuccess"));
    },
    onError: () => {
      notifier.error(t("pages.tenantMemberships.notifications.defaultError"));
    },
  });

  const activeWorkspaceLabel = principal
    ? principal.contextType === WorkspaceContextType.PLATFORM
      ? t("pages.tenantMemberships.platformWorkspace")
      : principal.activeWorkspaceName
    : null;

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
          {activeWorkspaceLabel && (
            <div className="text-sm text-muted-foreground">
              {t("pages.tenantMemberships.currentTenantLabel")}{" "}
              <span className="font-medium text-foreground">{activeWorkspaceLabel}</span>
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
          ) : workspaces.length === 0 ? (
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
                    <TableHead className="text-right">{t("pages.tenantMemberships.columns.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workspaces.map((workspace) => {
                    const active = isWorkspaceActive(
                      workspace,
                      principal?.contextType ?? WorkspaceContextType.PLATFORM,
                      principal?.activeTenantUuid ?? null
                    );
                    const workspaceName = getWorkspaceDisplayName(
                      workspace,
                      t("pages.tenantMemberships.platformWorkspace")
                    );
                    const isDefault = isDefaultWorkspace(workspace);

                    return (
                      <TableRow key={`${getWorkspaceKey(workspace)}-${workspace.role}`}>
                        <TableCell className="font-medium">{workspaceName}</TableCell>
                        <TableCell>{formatRoleLabel(workspace.role)}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            {active && (
                              <Badge variant="secondary">
                                <Check className="h-3 w-3" />
                                {t("pages.tenantMemberships.badges.active")}
                              </Badge>
                            )}
                            {isDefault && (
                              <Badge variant="outline">
                                <Star className="h-3 w-3" />
                                {t("pages.tenantMemberships.badges.default")}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => switchWorkspaceMutation.mutate(workspace)}
                              disabled={active || switchWorkspaceMutation.isPending}
                              aria-label={`${t("pages.tenantMemberships.actions.switch")} ${workspaceName}`}
                            >
                              {switchWorkspaceMutation.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Repeat2 className="mr-2 h-4 w-4" />
                              )}
                              {active
                                ? t("pages.tenantMemberships.actions.active")
                                : t("pages.tenantMemberships.actions.switch")}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => setDefaultWorkspaceMutation.mutate(workspace)}
                              disabled={isDefault || setDefaultWorkspaceMutation.isPending}
                              aria-label={`${t("pages.tenantMemberships.actions.setDefault")} ${workspaceName}`}
                            >
                              {setDefaultWorkspaceMutation.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              )}
                              {isDefault
                                ? t("pages.tenantMemberships.actions.default")
                                : t("pages.tenantMemberships.actions.setDefault")}
                            </Button>
                          </div>
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
