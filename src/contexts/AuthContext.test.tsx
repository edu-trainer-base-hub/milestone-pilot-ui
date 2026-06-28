import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
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

vi.mock("@/services/ProfileService.ts", () => ({
  getMe: profileMock.getMe,
}));

vi.mock("@/services/AuthService.ts", () => ({
  logout: authServiceMock.logout,
  logoutTelegram: authServiceMock.logoutTelegram,
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
      <button type="button" onClick={() => auth.loginWithTelegram()}>
        telegram
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

  it("populates tenant fields in principal from the login response", async () => {
    apiMock.post.mockResolvedValue({
      accessToken: "login-token",
      activeTenantId: "tenant-1",
      activeTenantUuid: "tenant-uuid-1",
      activeTenantName: "Tenant Alpha",
      activeTenantRole: "ROLE_TENANT_ADMIN",
      tenants: [
        {
          tenantId: "tenant-1",
          tenantName: "Tenant Alpha",
          role: "ROLE_TENANT_ADMIN",
          isDefault: true,
          isActive: true,
        },
      ],
    });
    jwtMock.jwtDecode.mockReturnValue({
      sub: "user-1",
      authorities: ["MANAGE_PROFILES"],
    });

    render(
      <AuthProvider>
        <TestHarness />
      </AuthProvider>
    );

    await screen.findByRole("button", { name: "login" });
    fireEvent.click(screen.getByRole("button", { name: "login" }));

    await waitFor(() => {
      expect(screen.getByTestId("principal")).toHaveTextContent("Tenant Alpha");
      expect(screen.getByTestId("principal")).toHaveTextContent("ROLE_TENANT_ADMIN");
      expect(screen.getByTestId("principal")).toHaveTextContent("tenant-uuid-1");
    });
  });

  it("falls back to JWT tenant claims when refresh response omits tenant fields", async () => {
    apiMock.post.mockResolvedValue({
      accessToken: "refresh-token",
    });
    jwtMock.jwtDecode.mockReturnValue({
      sub: "user-2",
      authorities: ["MANAGE_PROFILES"],
      tenantId: "tenant-2",
      tenantUuid: "tenant-uuid-2",
      tenantName: "Tenant Beta",
      tenantRole: "ROLE_TENANT_MANAGER",
    });

    render(
      <AuthProvider>
        <TestHarness />
      </AuthProvider>
    );

    await screen.findByRole("button", { name: "refresh" });
    fireEvent.click(screen.getByRole("button", { name: "refresh" }));

    await waitFor(() => {
      expect(screen.getByTestId("principal")).toHaveTextContent("Tenant Beta");
      expect(screen.getByTestId("principal")).toHaveTextContent("tenant-2");
      expect(screen.getByTestId("principal")).toHaveTextContent("ROLE_TENANT_MANAGER");
    });
  });

  it("uses the same tenant-aware session path for Telegram login", async () => {
    apiMock.post.mockResolvedValue({
      accessToken: "telegram-token",
      activeTenantId: "tenant-3",
      activeTenantName: "Tenant Gamma",
      activeTenantRole: "ROLE_TENANT_MANAGER",
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

    await screen.findByRole("button", { name: "telegram" });
    fireEvent.click(screen.getByRole("button", { name: "telegram" }));

    await waitFor(() => {
      expect(apiMock.post).toHaveBeenCalledWith("/auth/login/telegram", { initData: null });
      expect(screen.getByTestId("principal")).toHaveTextContent("Tenant Gamma");
      expect(screen.getByTestId("principal")).toHaveTextContent("tenant-3");
    });
  });
});
