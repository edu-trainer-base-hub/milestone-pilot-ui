import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TenantUsersPage } from "./TenantUsersPage";

const apiMock = vi.hoisted(() => ({
  getUsersByTenant: vi.fn(),
  createUserInTenant: vi.fn(),
  updateUserInTenant: vi.fn(),
}));

const notifierMock = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}));

const authMock = vi.hoisted(() => ({
  principal: {
    activeTenantId: "tenant-1",
    activeTenantUuid: "tenant-1",
    activeTenantRole: "ROLE_TENANT_ADMIN",
  },
}));

vi.mock("../api", () => ({
  getUsersByTenant: apiMock.getUsersByTenant,
  createUserInTenant: apiMock.createUserInTenant,
  updateUserInTenant: apiMock.updateUserInTenant,
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
  }),
}));

const renderPage = (initialEntry = "/platform/tenants/tenant-1/users") => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/platform/tenants/:tenantId/users" element={<TenantUsersPage />} />
          <Route path="/tenant/users" element={<TenantUsersPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

const getRowForEmail = async (email: string) => {
  const cell = await screen.findByText(email);
  const row = cell.closest("tr");

  expect(row).not.toBeNull();
  return row as HTMLElement;
};

describe("TenantUsersPage", () => {
  beforeEach(() => {
    apiMock.getUsersByTenant.mockReset();
    apiMock.createUserInTenant.mockReset();
    apiMock.updateUserInTenant.mockReset();
    notifierMock.success.mockReset();
    notifierMock.error.mockReset();
    authMock.principal.activeTenantRole = "ROLE_TENANT_ADMIN";
  });

  it("lets tenant admins create tenant users and choose manager or user roles", async () => {
    apiMock.getUsersByTenant.mockResolvedValue([]);
    apiMock.createUserInTenant.mockResolvedValue({ id: "user-2" });

    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Add User" }));

    const roleSelect = screen.getByRole("combobox");
    expect(roleSelect).toHaveTextContent("TENANT MANAGER");

    fireEvent.click(roleSelect);
    const listbox = await screen.findByRole("listbox");
    expect(within(listbox).getByRole("option", { name: "TENANT MANAGER" })).toBeInTheDocument();
    fireEvent.click(within(listbox).getByRole("option", { name: "TENANT USER" }));

    fireEvent.change(screen.getByLabelText("Admin's Email"), { target: { value: "member@example.com" } });
    fireEvent.change(screen.getByLabelText("First Name"), { target: { value: "Tenant" } });
    fireEvent.change(screen.getByLabelText("Last Name"), { target: { value: "Member" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(apiMock.createUserInTenant).toHaveBeenCalledWith("tenant-1", {
        email: "member@example.com",
        firstName: "Tenant",
        lastName: "Member",
        role: "ROLE_TENANT_USER",
      })
    );
    expect(notifierMock.success).toHaveBeenCalled();
  });

  it("limits tenant managers to creating tenant users only", async () => {
    authMock.principal.activeTenantRole = "ROLE_TENANT_MANAGER";
    apiMock.getUsersByTenant.mockResolvedValue([]);
    apiMock.createUserInTenant.mockResolvedValue({ id: "user-2" });

    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Add User" }));

    const roleSelect = screen.getByRole("combobox");
    expect(roleSelect).toHaveTextContent("TENANT USER");

    fireEvent.click(roleSelect);
    const listbox = await screen.findByRole("listbox");
    expect(within(listbox).getByRole("option", { name: "TENANT USER" })).toBeInTheDocument();
    expect(within(listbox).queryByRole("option", { name: "TENANT MANAGER" })).not.toBeInTheDocument();
    fireEvent.keyDown(listbox, { key: "Escape" });

    fireEvent.change(screen.getByLabelText("Admin's Email"), { target: { value: "user@example.com" } });
    fireEvent.change(screen.getByLabelText("First Name"), { target: { value: "Tenant" } });
    fireEvent.change(screen.getByLabelText("Last Name"), { target: { value: "User" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(apiMock.createUserInTenant).toHaveBeenCalledWith("tenant-1", {
        email: "user@example.com",
        firstName: "Tenant",
        lastName: "User",
        role: "ROLE_TENANT_USER",
      })
    );
  });

  it("hides edit actions for rows a tenant manager cannot manage", async () => {
    authMock.principal.activeTenantRole = "ROLE_TENANT_MANAGER";
    apiMock.getUsersByTenant.mockResolvedValue([
      {
        id: "user-1",
        tenantId: "tenant-1",
        email: "tenant-admin@example.com",
        firstName: "Tenant",
        lastName: "Admin",
        role: "ROLE_TENANT_ADMIN",
      },
      {
        id: "user-2",
        tenantId: "tenant-1",
        email: "tenant-manager@example.com",
        firstName: "Tenant",
        lastName: "Manager",
        role: "ROLE_TENANT_MANAGER",
      },
      {
        id: "user-3",
        tenantId: "tenant-1",
        email: "tenant-user@example.com",
        firstName: "Tenant",
        lastName: "User",
        role: "ROLE_TENANT_USER",
      },
    ]);

    renderPage();

    const adminRow = await getRowForEmail("tenant-admin@example.com");
    const managerRow = await getRowForEmail("tenant-manager@example.com");
    const userRow = await getRowForEmail("tenant-user@example.com");

    expect(within(adminRow).queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
    expect(within(managerRow).queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
    expect(within(userRow).getByRole("button", { name: "Edit" })).toBeInTheDocument();
  });

  it("keeps tenant admin rows read-only for tenant admins while allowing manager edits", async () => {
    apiMock.getUsersByTenant.mockResolvedValue([
      {
        id: "user-1",
        tenantId: "tenant-1",
        email: "tenant-admin@example.com",
        firstName: "Tenant",
        lastName: "Admin",
        role: "ROLE_TENANT_ADMIN",
      },
      {
        id: "user-2",
        tenantId: "tenant-1",
        email: "tenant-manager@example.com",
        firstName: "Tenant",
        lastName: "Manager",
        role: "ROLE_TENANT_MANAGER",
      },
    ]);
    apiMock.updateUserInTenant.mockResolvedValue({ id: "user-2" });

    renderPage();

    const adminRow = await getRowForEmail("tenant-admin@example.com");
    const managerRow = await getRowForEmail("tenant-manager@example.com");

    expect(within(adminRow).queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();

    fireEvent.click(within(managerRow).getByRole("button", { name: "Edit" }));
    fireEvent.change(screen.getByLabelText("First Name"), { target: { value: "Updated Tenant" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(apiMock.updateUserInTenant).toHaveBeenCalledWith("tenant-1", "user-2", {
        email: "tenant-manager@example.com",
        firstName: "Updated Tenant",
        lastName: "Manager",
        role: "ROLE_TENANT_MANAGER",
      })
    );
    expect(notifierMock.success).toHaveBeenCalled();
  });

  it("disables user creation when the actor has no assignable roles", async () => {
    authMock.principal.activeTenantRole = "ROLE_TENANT_USER";
    apiMock.getUsersByTenant.mockResolvedValue([]);

    renderPage();

    expect(await screen.findByRole("button", { name: "Add User" })).toBeDisabled();
  });

  it("uses the active tenant when opened from the tenant route", async () => {
    apiMock.getUsersByTenant.mockResolvedValue([
      {
        id: "user-1",
        tenantId: "tenant-1",
        email: "tenant-admin@example.com",
        firstName: "Tenant",
        lastName: "Admin",
        role: "ROLE_TENANT_ADMIN",
      },
    ]);

    renderPage("/tenant/users");

    expect(await screen.findByText("tenant-admin@example.com")).toBeInTheDocument();
    expect(apiMock.getUsersByTenant).toHaveBeenCalledWith("tenant-1");
  });
});
