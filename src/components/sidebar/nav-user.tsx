"use client";

import {
  /*BadgeCheck,
  Bell,*/
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Settings2,
  /*Sparkles,*/
  Users,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar.tsx";
import { Authority, useAuth } from "@/contexts/AuthContext.tsx";
import { useNavigate } from "react-router-dom";

export function NavUser({
  user,
}: {
  user: {
    name: string;
    email: string;
    avatar: string;
    authorities: string[];
  };
}) {
  const { isMobile } = useSidebar();
  const { logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const canManageProfiles = user.authorities?.includes(Authority.MANAGE_PROFILES);
  const canManageSubscriptions = user.authorities?.includes(Authority.MANAGE_SUBSCRIPTIONS);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">CN</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {/*<DropdownMenuItem>
                <Sparkles />
                {t("menu.user.upgrade", "Upgrade to Pro")}
              </DropdownMenuItem>*/}
              {canManageSubscriptions && (
                <DropdownMenuItem onClick={() => navigate("/subscriptions")}>
                  <CreditCard />
                  {t("menu.user.subscriptions", "Subscriptions")}
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {/*<DropdownMenuItem>
                <BadgeCheck />
                {t("menu.user.account", "Account")}
              </DropdownMenuItem>*/}
              {canManageProfiles && (
                <DropdownMenuItem onClick={() => navigate("/settings")}>
                  <Settings2 />
                  {t("menu.user.settings", "Settings")}
                </DropdownMenuItem>
              )}
              {/*<DropdownMenuItem>
                <CreditCard />
                {t("menu.user.billing", "Billing")}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell />
                {t("menu.user.notifications", "Notifications")}
              </DropdownMenuItem>*/}
              {canManageProfiles && (
                <DropdownMenuItem onClick={() => navigate("/settings/profiles")}>
                  <Users />
                  {t("menu.user.profiles", "Profiles")}
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              <LogOut />
              {t("menu.user.logout", "Log out")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
