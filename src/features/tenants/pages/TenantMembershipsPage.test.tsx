import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TenantMembershipsPage } from "./TenantMembershipsPage";

const apiMock = vi.hoisted(() => ({
  getCurrentUserTenantMemberships: vi.fn(),
  setDefaultTenant: vi.fn(),
}));

const notifierMock = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}));

const authMock = vi.hoisted(() => ({
  doRefresh: vi.fn(),
  principal: {
    id: "user-1",
    username: "tenant.user",
    firstName: "Tenant",
    lastName: "User",
    email: "tenant.user@example.com",
    profileType: "PRIMARY",
    authorities: [],
    activeTenantId: "tenant-1",
    activeTenantUuid: null,
    activeTenantName: "Tenant Alpha",
    activeTenantRole: "ROLE_TENANT_ADMIN",
    tenants: [],
  },
}));

vi.mock("../api", () => ({
  getCurrentUserTenantMemberships: apiMock.getCurrentUserTenantMemberships,
  setDefaultTenant: apiMock.setDefaultTenant,
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
    doRefresh: authMock.doRefresh,
  }),
}));

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
    apiMock.getCurrentUserTenantMemberships.mockReset();
    apiMock.setDefaultTenant.mockReset();
    notifierMock.success.mockReset();
    notifierMock.error.mockReset();
    authMock.doRefresh.mockReset();
  });

  it("renders memberships and switches inactive tenants in refresh order", async () => {
    const calls: string[] = [];

    apiMock.getCurrentUserTenantMemberships.mockResolvedValue([
      {
        tenantId: "tenant-1",
        tenantName: "Tenant Alpha",
        role: "ROLE_TENANT_ADMIN",
        isDefault: true,
      },
      {
        tenantId: "tenant-2",
        tenantName: "Tenant Beta",
        role: "ROLE_TENANT_MANAGER",
        isDefault: false,
      },
    ]);
    apiMock.setDefaultTenant.mockImplementation(async () => {
      calls.push("setDefaultTenant");
    });
    authMock.doRefresh.mockImplementation(async () => {
      calls.push("doRefresh");
      return "new-token";
    });

    const { invalidateSpy } = renderPage();
    invalidateSpy.mockImplementation(async () => {
      calls.push("invalidateQueries");
      return undefined;
    });

    expect(await screen.findByRole("button", { name: "Switch Tenant Beta" })).toBeInTheDocument();
    expect(screen.getAllByText("Tenant Alpha")).toHaveLength(2);
    expect(screen.getByText("Default")).toBeInTheDocument();
    expect(screen.getAllByText("Active")).toHaveLength(2);

    expect(screen.getByRole("button", { name: "Active Tenant Alpha" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Switch Tenant Beta" }));

    await waitFor(() => {
      expect(apiMock.setDefaultTenant).toHaveBeenCalledWith("tenant-2");
      expect(authMock.doRefresh).toHaveBeenCalled();
      expect(invalidateSpy).toHaveBeenCalled();
    });

    expect(calls).toEqual(["setDefaultTenant", "doRefresh", "invalidateQueries"]);
    expect(notifierMock.success).toHaveBeenCalled();
  });
});
