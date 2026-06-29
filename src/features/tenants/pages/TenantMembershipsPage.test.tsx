import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WorkspaceContextType } from "../types";
import { TenantMembershipsPage } from "./TenantMembershipsPage";

const apiMock = vi.hoisted(() => ({
  getCurrentUserWorkspaces: vi.fn(),
  setDefaultWorkspace: vi.fn(),
}));

const notifierMock = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}));

const navigateMock = vi.hoisted(() => vi.fn());

const authMock = vi.hoisted(() => ({
  switchWorkspace: vi.fn(),
  doRefresh: vi.fn(),
  principal: {
    id: "user-1",
    username: "tenant.user",
    firstName: "Tenant",
    lastName: "User",
    email: "tenant.user@example.com",
    profileType: "PRIMARY",
    authorities: [],
    contextType: "TENANT",
    activeTenantUuid: "tenant-1",
    activeRole: "ROLE_TENANT_ADMIN",
    activeWorkspaceName: "Tenant Alpha",
    availableWorkspaces: [],
  },
}));

vi.mock("../api", () => ({
  getCurrentUserWorkspaces: apiMock.getCurrentUserWorkspaces,
  setDefaultWorkspace: apiMock.setDefaultWorkspace,
}));

vi.mock("@/services/NotificationService", () => ({
  notifier: {
    success: notifierMock.success,
    error: notifierMock.error,
  },
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    principal: authMock.principal,
    switchWorkspace: authMock.switchWorkspace,
    doRefresh: authMock.doRefresh,
  }),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

const renderPage = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <TenantMembershipsPage />
      </MemoryRouter>
    </QueryClientProvider>
  );

  return { invalidateSpy };
};

describe("TenantMembershipsPage", () => {
  beforeEach(() => {
    apiMock.getCurrentUserWorkspaces.mockReset();
    apiMock.setDefaultWorkspace.mockReset();
    notifierMock.success.mockReset();
    notifierMock.error.mockReset();
    navigateMock.mockReset();
    authMock.switchWorkspace.mockReset();
    authMock.doRefresh.mockReset();
  });

  it("renders platform and tenant workspaces with independent active and default badges", async () => {
    apiMock.getCurrentUserWorkspaces.mockResolvedValue([
      {
        contextType: WorkspaceContextType.PLATFORM,
        role: "ROLE_PLATFORM_ADMIN",
        isActive: false,
        isDefault: true,
      },
      {
        contextType: WorkspaceContextType.TENANT,
        tenantUuid: "tenant-1",
        tenantName: "Tenant Alpha",
        role: "ROLE_TENANT_ADMIN",
        isActive: true,
        isDefault: false,
      },
    ]);

    renderPage();

    expect(await screen.findByText("Platform")).toBeInTheDocument();
    expect(screen.getAllByText("Tenant Alpha")).toHaveLength(2);
    expect(screen.getAllByText("Default")).toHaveLength(2);
    expect(screen.getAllByText("Active").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Switch Tenant Alpha" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Set default Tenant Alpha" })).toBeInTheDocument();
  });

  it("switches workspace, invalidates cache, and navigates home", async () => {
    const calls: string[] = [];

    apiMock.getCurrentUserWorkspaces.mockResolvedValue([
      {
        contextType: WorkspaceContextType.TENANT,
        tenantUuid: "tenant-1",
        tenantName: "Tenant Alpha",
        role: "ROLE_TENANT_ADMIN",
        isActive: true,
      },
      {
        contextType: WorkspaceContextType.PLATFORM,
        role: "ROLE_PLATFORM_ADMIN",
      },
    ]);
    authMock.switchWorkspace.mockImplementation(async () => {
      calls.push("switchWorkspace");
    });

    const { invalidateSpy } = renderPage();
    invalidateSpy.mockImplementation(async () => {
      calls.push("invalidateQueries");
      return undefined;
    });

    fireEvent.click(await screen.findByRole("button", { name: "Switch Platform" }));

    await waitFor(() => {
      expect(authMock.switchWorkspace).toHaveBeenCalledWith(WorkspaceContextType.PLATFORM, null);
      expect(invalidateSpy).toHaveBeenCalled();
      expect(navigateMock).toHaveBeenCalledWith("/");
    });

    expect(calls).toEqual(["switchWorkspace", "invalidateQueries"]);
    expect(notifierMock.success).toHaveBeenCalled();
  });

  it("sets the default workspace without switching context", async () => {
    apiMock.getCurrentUserWorkspaces.mockResolvedValue([
      {
        contextType: WorkspaceContextType.PLATFORM,
        role: "ROLE_PLATFORM_ADMIN",
        isDefault: false,
      },
      {
        contextType: WorkspaceContextType.TENANT,
        tenantUuid: "tenant-1",
        tenantName: "Tenant Alpha",
        role: "ROLE_TENANT_ADMIN",
        isActive: true,
        isDefault: true,
      },
    ]);
    apiMock.setDefaultWorkspace.mockResolvedValue(undefined);
    authMock.doRefresh.mockResolvedValue("new-token");

    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Set default Platform" }));

    await waitFor(() => {
      expect(apiMock.setDefaultWorkspace).toHaveBeenCalledWith({
        contextType: WorkspaceContextType.PLATFORM,
        tenantUuid: null,
      });
      expect(authMock.switchWorkspace).not.toHaveBeenCalled();
      expect(authMock.doRefresh).toHaveBeenCalled();
      expect(navigateMock).not.toHaveBeenCalled();
    });
  });
});
