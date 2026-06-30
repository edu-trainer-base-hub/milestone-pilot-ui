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
    activeTenantId: "1",
    activeTenantUuid: "tenant-uuid-1",
    activeTenantRole: "ROLE_TENANT_ADMIN",
    authorities: [] as string[],
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

vi.mock("@/contexts/AuthContext", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/contexts/AuthContext")>();

  return {
    ...actual,
    useAuth: () => ({
      principal: authMock.principal,
    }),
  };
});

const renderPage = (initialEntry = "/platform/tenants/tenant-uuid-1/users") => {
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
    authMock.principal.authorities = [];
  });

  it("lets tenant-user management authorities create the matching tenant roles", async () => {
    authMock.principal.authorities = ["TENANT_MANAGERS_CREATE", "TENANT_USERS_CREATE", "TENANT_MANAGERS_READ"];
    apiMock.getUsersByTenant.mockResolvedValue([]);
    apiMock.createUserInTenant.mockResolvedValue({ uuid: "user-2" });

    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Add User" }));

    const roleSelect = screen.getByRole("combobox");
    expect(roleSelect).toHaveTextContent("TENANT MANAGER");

    fireEvent.click(roleSelect);
    const listbox = await screen.findByRole("listbox");
    expect(within(listbox).getByRole("option", { name: "TENANT MANAGER" })).toBeInTheDocument();
    fireEvent.click(within(listbox).getByRole("option", { name: "TENANT USER" }));

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "member@example.com" } });
    fireEvent.change(screen.getByLabelText("First Name"), { target: { value: "Tenant" } });
    fireEvent.change(screen.getByLabelText("Last Name"), { target: { value: "Member" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(apiMock.createUserInTenant).toHaveBeenCalledWith("tenant-uuid-1", {
        email: "member@example.com",
        firstName: "Tenant",
        lastName: "Member",
        role: "ROLE_TENANT_USER",
      })
    );
    expect(notifierMock.success).toHaveBeenCalled();
  });

  it("limits creation to tenant-user authority even when the actor role is manager", async () => {
    authMock.principal.activeTenantRole = "ROLE_TENANT_MANAGER";
    authMock.principal.authorities = ["TENANT_USERS_CREATE", "TENANT_USERS_READ"];
    apiMock.getUsersByTenant.mockResolvedValue([]);
    apiMock.createUserInTenant.mockResolvedValue({ uuid: "user-2" });

    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Add User" }));

    const roleSelect = screen.getByRole("combobox");
    expect(roleSelect).toHaveTextContent("TENANT USER");

    fireEvent.click(roleSelect);
    const listbox = await screen.findByRole("listbox");
    expect(within(listbox).getByRole("option", { name: "TENANT USER" })).toBeInTheDocument();
    expect(within(listbox).queryByRole("option", { name: "TENANT MANAGER" })).not.toBeInTheDocument();
    fireEvent.keyDown(listbox, { key: "Escape" });

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "user@example.com" } });
    fireEvent.change(screen.getByLabelText("First Name"), { target: { value: "Tenant" } });
    fireEvent.change(screen.getByLabelText("Last Name"), { target: { value: "User" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(apiMock.createUserInTenant).toHaveBeenCalledWith("tenant-uuid-1", {
        email: "user@example.com",
        firstName: "Tenant",
        lastName: "User",
        role: "ROLE_TENANT_USER",
      })
    );
  });

  it("hides edit actions for rows a tenant manager cannot manage", async () => {
    authMock.principal.activeTenantRole = "ROLE_TENANT_MANAGER";
    authMock.principal.authorities = ["TENANT_USERS_READ", "TENANT_USERS_UPDATE"];
    apiMock.getUsersByTenant.mockResolvedValue([
      {
        uuid: "user-1",
        email: "tenant-admin@example.com",
        firstName: "Tenant",
        lastName: "Admin",
        role: "ROLE_TENANT_ADMIN",
      },
      {
        uuid: "user-2",
        email: "tenant-manager@example.com",
        firstName: "Tenant",
        lastName: "Manager",
        role: "ROLE_TENANT_MANAGER",
      },
      {
        uuid: "user-3",
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

  it("keeps rows read-only when their role lacks update authority", async () => {
    authMock.principal.authorities = ["TENANT_MANAGERS_READ", "TENANT_MANAGERS_UPDATE"];
    apiMock.getUsersByTenant.mockResolvedValue([
      {
        uuid: "user-1",
        email: "tenant-admin@example.com",
        firstName: "Tenant",
        lastName: "Admin",
        role: "ROLE_TENANT_ADMIN",
      },
      {
        uuid: "user-2",
        email: "tenant-manager@example.com",
        firstName: "Tenant",
        lastName: "Manager",
        role: "ROLE_TENANT_MANAGER",
      },
    ]);
    apiMock.updateUserInTenant.mockResolvedValue({ uuid: "user-2" });

    renderPage();

    const adminRow = await getRowForEmail("tenant-admin@example.com");
    const managerRow = await getRowForEmail("tenant-manager@example.com");

    expect(within(adminRow).queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();

    fireEvent.click(within(managerRow).getByRole("button", { name: "Edit" }));
    expect(screen.getByLabelText("Email")).toHaveAttribute("readonly");
    fireEvent.change(screen.getByLabelText("First Name"), { target: { value: "Updated Tenant" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(apiMock.updateUserInTenant).toHaveBeenCalledWith("tenant-uuid-1", "user-2", {
        firstName: "Updated Tenant",
        lastName: "Manager",
        role: "ROLE_TENANT_MANAGER",
      })
    );
    expect(notifierMock.success).toHaveBeenCalled();
  });

  it("disables user creation when the actor has no tenant create authorities", async () => {
    authMock.principal.activeTenantRole = "ROLE_TENANT_ADMIN";
    authMock.principal.authorities = ["TENANT_USERS_READ"];
    apiMock.getUsersByTenant.mockResolvedValue([]);

    renderPage();

    expect(await screen.findByRole("button", { name: "Add User" })).toBeDisabled();
  });

  it("uses the active tenant when opened from the tenant route", async () => {
    authMock.principal.authorities = ["TENANT_ADMINS_READ"];
    apiMock.getUsersByTenant.mockResolvedValue([
      {
        uuid: "user-1",
        email: "tenant-admin@example.com",
        firstName: "Tenant",
        lastName: "Admin",
        role: "ROLE_TENANT_ADMIN",
      },
    ]);

    renderPage("/tenant/users");

    expect(await screen.findByText("tenant-admin@example.com")).toBeInTheDocument();
    expect(apiMock.getUsersByTenant).toHaveBeenCalledWith("tenant-uuid-1");
  });

  it("does not unlock management actions from activeTenantRole alone", async () => {
    authMock.principal.activeTenantRole = "ROLE_TENANT_ADMIN";
    authMock.principal.authorities = [];
    apiMock.getUsersByTenant.mockResolvedValue([
      {
        uuid: "user-1",
        email: "tenant-user@example.com",
        firstName: "Tenant",
        lastName: "User",
        role: "ROLE_TENANT_USER",
      },
    ]);

    renderPage();

    expect(await screen.findByRole("button", { name: "Add User" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
  });
});
