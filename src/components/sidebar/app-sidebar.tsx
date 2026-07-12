import * as React from "react";
import {
  Command,
  LifeBuoy,
  Mail,
  Send,
  Sparkles,
  SquareTerminal,
  LogIn,
  Building2,
  UserCog,
  Users,
} from "lucide-react";
import { NavUser } from "@/components/sidebar/nav-user.tsx";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar.tsx";
import { Authority, useAuth } from "@/contexts/AuthContext.tsx";
import { useSidebarContext } from "@/contexts/SidebarContext";
import { Link } from "react-router-dom";
import { NavSecondary } from "@/components/sidebar/nav-secondary";
import { useTranslation } from "react-i18next";
import { WorkspaceContextType } from "@/features/workspaces/model/types";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { FeatureFlag } from "@/services/FeatureFlagService";

const navSecondaryData = [
  {
    title: "Support",
    url: "#",
    icon: LifeBuoy,
  },
  {
    title: "Feedback",
    url: "#",
    icon: Send,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { t } = useTranslation();
  const { principal } = useAuth();
  const { sidebarContent } = useSidebarContext();
  const { isFeatureEnabled } = useFeatureFlags();
  const canViewPlatformUsers = principal?.authorities?.includes(Authority.UI_PLATFORM_USERS_VIEW);
  const canViewPlatformTenants = principal?.authorities?.includes(Authority.UI_PLATFORM_TENANTS_VIEW);
  const canViewTenantUsers = principal?.authorities?.includes(Authority.UI_TENANT_USERS_VIEW);
  const canViewTenantIntegrations = principal?.authorities?.includes(Authority.UI_TENANT_INTEGRATIONS_VIEW);
  const emailParsingLabEnabled = isFeatureEnabled(FeatureFlag.EMAIL_PARSING_LAB);

  const user = React.useMemo(() => {
    if (!principal) return null;
    return {
      name:
        principal.firstName && principal.lastName ? `${principal.firstName} ${principal.lastName}` : principal.username,
      email: principal.email || principal.username,
      avatar: "", // TODO: Add avatar to principal or profile
      authorities: principal.authorities,
      activeWorkspaceLabel:
        principal.contextType === WorkspaceContextType.PLATFORM
          ? t("pages.workspaceMemberships.platformWorkspace")
          : principal.activeWorkspaceName,
    };
  }, [principal, t]);

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{t("menu.title")}</span>
                  <span className="truncate text-xs">{t("menu.home")}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip={t("menu.home")}>
              <Link to="/">
                <SquareTerminal />
                <span>{t("menu.home")}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {/* User Management (Visible to everyone) */}
        {canViewPlatformUsers && (
          <SidebarGroup>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={t("platformUsers.title")}>
                  <Link to="/platform/users">
                    <UserCog />
                    <span>{t("platformUsers.title")}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        )}

        {/* Administration Section */}
        {canViewPlatformTenants && (
          <SidebarGroup>
            <SidebarGroupLabel>{t("menu.categories.administration", "Administration")}</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={t("tenants.title")}>
                  <Link to="/platform/tenants">
                    <Building2 />
                    <span>{t("tenants.title")}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        )}

        {canViewTenantUsers && (
          <SidebarGroup>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={t("tenants.users.title")}>
                  <Link to="/tenant/users">
                    <Users />
                    <span>{t("tenants.users.title")}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        )}

        {canViewTenantIntegrations && (
          <SidebarGroup>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={t("tenantIntegrations.title")}>
                  <Link to="/tenant/integrations/email">
                    <Mail />
                    <span>{t("tenantIntegrations.title")}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {emailParsingLabEnabled && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip={t("emailParsingLab.title")}>
                    <Link to="/tenant/integrations/email-parsing-lab">
                      <Sparkles />
                      <span>{t("emailParsingLab.title")}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroup>
        )}

        {/* Dynamic Content */}
        {sidebarContent}

        {/* Secondary Nav (Support, Feedback) - Pushed to bottom of content area */}
        <NavSecondary items={navSecondaryData} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        {user ? (
          <NavUser user={user} />
        ) : (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild size="lg">
                <Link to="/login">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <LogIn className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{t("menu.user.login")}</span>
                    <span className="truncate text-xs">{t("menu.user.loginDesc")}</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
