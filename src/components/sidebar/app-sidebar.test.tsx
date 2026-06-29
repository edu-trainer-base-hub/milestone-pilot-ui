import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { SidebarProvider } from "@/components/ui/sidebar";
import { SidebarContextProvider } from "@/contexts/SidebarContext";
import { WorkspaceContextType } from "@/features/tenants/types";
import { AppSidebar } from "./app-sidebar";

const authMock = vi.hoisted(() => ({
  Authority: {
    UI_PLATFORM_TENANTS_VIEW: "UI_PLATFORM_TENANTS_VIEW",
    UI_PLATFORM_USERS_VIEW: "UI_PLATFORM_USERS_VIEW",
    UI_TENANT_USERS_VIEW: "UI_TENANT_USERS_VIEW",
  } as const,
  state: {
    principal: null as {
      username: string;
      firstName: string | null;
      lastName: string | null;
      email: string | null;
      authorities: string[];
      contextType: WorkspaceContextType;
      activeWorkspaceName: string | null;
    } | null,
  },
}));

vi.mock("@/contexts/AuthContext.tsx", () => ({
  Authority: authMock.Authority,
  useAuth: () => ({
    principal: authMock.state.principal,
  }),
}));

vi.mock("@/components/sidebar/nav-user.tsx", () => ({
  NavUser: () => <div>Nav User</div>,
}));

const renderSidebar = (authorities: string[]) => {
  authMock.state.principal = {
    username: "platform-user",
    firstName: "Platform",
    lastName: "User",
    email: "platform@example.com",
    authorities,
    contextType: WorkspaceContextType.PLATFORM,
    activeWorkspaceName: null,
  };

  render(
    <MemoryRouter>
      <SidebarContextProvider>
        <SidebarProvider>
          <AppSidebar />
        </SidebarProvider>
      </SidebarContextProvider>
    </MemoryRouter>
  );
};

describe("AppSidebar", () => {
  it("shows platform links from UI authorities", () => {
    renderSidebar([
      authMock.Authority.UI_PLATFORM_USERS_VIEW,
      authMock.Authority.UI_PLATFORM_TENANTS_VIEW,
      authMock.Authority.UI_TENANT_USERS_VIEW,
    ]);

    expect(screen.getByText("Platform Users")).toBeInTheDocument();
    expect(screen.getByText("Tenants")).toBeInTheDocument();
    expect(screen.getByText("Tenant Users")).toBeInTheDocument();
  });

  it("does not show admin links for legacy role strings alone", () => {
    renderSidebar(["ROLE_PLATFORM_ADMIN"]);

    expect(screen.queryByText("Platform Users")).not.toBeInTheDocument();
    expect(screen.queryByText("Tenants")).not.toBeInTheDocument();
    expect(screen.queryByText("Tenant Users")).not.toBeInTheDocument();
  });
});
