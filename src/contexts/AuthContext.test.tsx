import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WorkspaceContextType } from "@/features/workspaces/model/types";
import { AuthProvider, useAuth } from "./AuthContext";

const apiMock = vi.hoisted(() => ({
  post: vi.fn(),
  registerRefreshFn: vi.fn(),
  registerLogoutFn: vi.fn(),
}));

const profileMock = vi.hoisted(() => ({
  getMe: vi.fn(),
}));

const authServiceMock = vi.hoisted(() => ({
  logout: vi.fn(),
  logoutTelegram: vi.fn(),
}));

const workspaceApiMock = vi.hoisted(() => ({
  switchWorkspace: vi.fn(),
}));

const jwtMock = vi.hoisted(() => ({
  jwtDecode: vi.fn(),
}));

const webAppMock = vi.hoisted(() => ({
  ready: vi.fn(),
  initData: "",
}));

vi.mock("@/services/ApiService.ts", () => ({
  post: apiMock.post,
  registerRefreshFn: apiMock.registerRefreshFn,
  registerLogoutFn: apiMock.registerLogoutFn,
}));

vi.mock("@/services/CurrentUserService.ts", () => ({
  getMe: profileMock.getMe,
}));

vi.mock("@/services/AuthService.ts", () => ({
  logout: authServiceMock.logout,
  logoutTelegram: authServiceMock.logoutTelegram,
}));

vi.mock("@/features/workspaces/api/workspaces", () => ({
  switchWorkspace: workspaceApiMock.switchWorkspace,
}));

vi.mock("jwt-decode", () => ({
  jwtDecode: jwtMock.jwtDecode,
}));

vi.mock("@twa-dev/sdk", () => ({
  default: webAppMock,
}));

const TestHarness = () => {
  const auth = useAuth();

  return (
    <div>
      <button type="button" onClick={() => auth.login("user@example.com", "secret")}>
        login
      </button>
      <button type="button" onClick={() => auth.doRefresh()}>
        refresh
      </button>
      <button type="button" onClick={() => auth.switchWorkspace(WorkspaceContextType.PLATFORM)}>
        switch-platform
      </button>
      <div data-testid="principal">{JSON.stringify(auth.principal)}</div>
    </div>
  );
};

describe("AuthContext", () => {
  beforeEach(() => {
    localStorage.clear();
    apiMock.post.mockReset();
    apiMock.registerRefreshFn.mockReset();
    apiMock.registerLogoutFn.mockReset();
    profileMock.getMe.mockReset();
    authServiceMock.logout.mockReset();
    authServiceMock.logoutTelegram.mockReset();
    workspaceApiMock.switchWorkspace.mockReset();
    jwtMock.jwtDecode.mockReset();
    webAppMock.ready.mockReset();
    webAppMock.initData = "";

    profileMock.getMe.mockResolvedValue({
      id: 1,
      uuid: "profile-1",
      profileType: "PRIMARY",
      username: "tenant.user",
      firstName: "Tenant",
      lastName: "User",
      email: "tenant.user@example.com",
      locale: "en-US",
      primaryProfileUuid: null,
      verifiedEmail: true,
    });
  });

  it("stores a tenant workspace session from login", async () => {
    apiMock.post.mockResolvedValue({
      accessToken: "login-token",
      contextType: WorkspaceContextType.TENANT,
      activeTenantUuid: "tenant-uuid-1",
      activeRole: "ROLE_TENANT_ADMIN",
      availableWorkspaces: [
        {
          contextType: WorkspaceContextType.TENANT,
          tenantUuid: "tenant-uuid-1",
          tenantName: "Tenant Alpha",
          role: "ROLE_TENANT_ADMIN",
          isActive: true,
          isDefault: true,
        },
      ],
    });
    jwtMock.jwtDecode.mockReturnValue({
      sub: "user-1",
      authorities: ["MANAGE_PROFILES", "TENANT_USERS_READ"],
    });

    render(
      <AuthProvider>
        <TestHarness />
      </AuthProvider>
    );

    fireEvent.click(await screen.findByRole("button", { name: "login" }));

    await waitFor(() => {
      expect(screen.getByTestId("principal")).toHaveTextContent('"contextType":"TENANT"');
      expect(screen.getByTestId("principal")).toHaveTextContent('"activeTenantUuid":"tenant-uuid-1"');
      expect(screen.getByTestId("principal")).toHaveTextContent('"activeRole":"ROLE_TENANT_ADMIN"');
      expect(screen.getByTestId("principal")).toHaveTextContent('"activeWorkspaceName":"Tenant Alpha"');
    });
  });

  it("stores a platform workspace session from login", async () => {
    apiMock.post.mockResolvedValue({
      accessToken: "platform-token",
      contextType: WorkspaceContextType.PLATFORM,
      activeTenantUuid: null,
      activeRole: "ROLE_PLATFORM_ADMIN",
      availableWorkspaces: [
        {
          contextType: WorkspaceContextType.PLATFORM,
          role: "ROLE_PLATFORM_ADMIN",
          isActive: true,
          isDefault: true,
        },
      ],
    });
    jwtMock.jwtDecode.mockReturnValue({
      sub: "user-2",
      authorities: ["MANAGE_PROFILES", "PLATFORM_ADMINS_READ"],
    });

    render(
      <AuthProvider>
        <TestHarness />
      </AuthProvider>
    );

    fireEvent.click(await screen.findByRole("button", { name: "login" }));

    await waitFor(() => {
      expect(screen.getByTestId("principal")).toHaveTextContent('"contextType":"PLATFORM"');
      expect(screen.getByTestId("principal")).toHaveTextContent('"activeTenantUuid":null');
      expect(screen.getByTestId("principal")).toHaveTextContent('"activeRole":"ROLE_PLATFORM_ADMIN"');
      expect(screen.getByTestId("principal")).toHaveTextContent('"activeWorkspaceName":"Platform"');
    });
  });

  it("keeps the workspace returned by refresh even when another workspace is default", async () => {
    apiMock.post.mockResolvedValue({
      accessToken: "refresh-token",
      contextType: WorkspaceContextType.PLATFORM,
      activeTenantUuid: null,
      activeRole: "ROLE_PLATFORM_MANAGER",
      availableWorkspaces: [
        {
          contextType: WorkspaceContextType.PLATFORM,
          role: "ROLE_PLATFORM_MANAGER",
          isActive: true,
          isDefault: false,
        },
        {
          contextType: WorkspaceContextType.TENANT,
          tenantUuid: "tenant-uuid-2",
          tenantName: "Tenant Beta",
          role: "ROLE_TENANT_ADMIN",
          isActive: false,
          isDefault: true,
        },
      ],
    });
    jwtMock.jwtDecode.mockReturnValue({
      sub: "user-3",
      authorities: ["MANAGE_PROFILES"],
    });

    render(
      <AuthProvider>
        <TestHarness />
      </AuthProvider>
    );

    fireEvent.click(await screen.findByRole("button", { name: "refresh" }));

    await waitFor(() => {
      expect(screen.getByTestId("principal")).toHaveTextContent('"contextType":"PLATFORM"');
      expect(screen.getByTestId("principal")).toHaveTextContent('"activeWorkspaceName":"Platform"');
      expect(screen.getByTestId("principal")).toHaveTextContent('"availableWorkspaces":[');
      expect(screen.getByTestId("principal")).toHaveTextContent("Tenant Beta");
    });
  });

  it("replaces the session snapshot on workspace switch", async () => {
    apiMock.post.mockResolvedValue({
      accessToken: "login-token",
      contextType: WorkspaceContextType.TENANT,
      activeTenantUuid: "tenant-uuid-1",
      activeRole: "ROLE_TENANT_ADMIN",
      availableWorkspaces: [
        {
          contextType: WorkspaceContextType.TENANT,
          tenantUuid: "tenant-uuid-1",
          tenantName: "Tenant Alpha",
          role: "ROLE_TENANT_ADMIN",
          isActive: true,
        },
      ],
    });
    workspaceApiMock.switchWorkspace.mockResolvedValue({
      accessToken: "switch-token",
      contextType: WorkspaceContextType.PLATFORM,
      activeTenantUuid: null,
      activeRole: "ROLE_PLATFORM_ADMIN",
      availableWorkspaces: [
        {
          contextType: WorkspaceContextType.PLATFORM,
          role: "ROLE_PLATFORM_ADMIN",
          isActive: true,
        },
      ],
    });
    jwtMock.jwtDecode.mockReturnValue({
      sub: "user-4",
      authorities: ["MANAGE_PROFILES", "UI_PLATFORM_USERS_VIEW"],
    });

    render(
      <AuthProvider>
        <TestHarness />
      </AuthProvider>
    );

    fireEvent.click(await screen.findByRole("button", { name: "login" }));

    await waitFor(() => {
      expect(screen.getByTestId("principal")).toHaveTextContent('"contextType":"TENANT"');
    });

    fireEvent.click(screen.getByRole("button", { name: "switch-platform" }));

    await waitFor(() => {
      expect(workspaceApiMock.switchWorkspace).toHaveBeenCalledWith({
        contextType: WorkspaceContextType.PLATFORM,
        tenantUuid: undefined,
      });
      expect(screen.getByTestId("principal")).toHaveTextContent('"contextType":"PLATFORM"');
      expect(screen.getByTestId("principal")).toHaveTextContent('"activeWorkspaceName":"Platform"');
    });
  });
});
