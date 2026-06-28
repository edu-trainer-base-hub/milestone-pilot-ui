import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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

const renderPage = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/platform/tenants/tenant-1/users"]}>
        <Routes>
          <Route path="/platform/tenants/:tenantId/users" element={<TenantUsersPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe("TenantUsersPage", () => {
  beforeEach(() => {
    apiMock.getUsersByTenant.mockReset();
    apiMock.createUserInTenant.mockReset();
    apiMock.updateUserInTenant.mockReset();
    notifierMock.success.mockReset();
    notifierMock.error.mockReset();
  });

  it("renders tenant users and wires creation", async () => {
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
    apiMock.createUserInTenant.mockResolvedValue({
      id: "user-2",
    });

    renderPage();

    expect(await screen.findByText("tenant-admin@example.com")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Add User" }));
    fireEvent.change(screen.getByLabelText("Admin's Email"), { target: { value: "member@example.com" } });
    fireEvent.change(screen.getByLabelText("First Name"), { target: { value: "Tenant" } });
    fireEvent.change(screen.getByLabelText("Last Name"), { target: { value: "Member" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(apiMock.createUserInTenant).toHaveBeenCalledWith("tenant-1", {
        email: "member@example.com",
        firstName: "Tenant",
        lastName: "Member",
        role: "ROLE_TENANT_MANAGER",
      })
    );
    expect(notifierMock.success).toHaveBeenCalled();
  });

  it("wires tenant user updates", async () => {
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
    apiMock.updateUserInTenant.mockResolvedValue({
      id: "user-1",
    });

    renderPage();

    expect(await screen.findByText("tenant-admin@example.com")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.change(screen.getByLabelText("First Name"), { target: { value: "Updated Tenant" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(apiMock.updateUserInTenant).toHaveBeenCalledWith("tenant-1", "user-1", {
        email: "tenant-admin@example.com",
        firstName: "Updated Tenant",
        lastName: "Admin",
        role: "ROLE_TENANT_ADMIN",
      })
    );
    expect(notifierMock.success).toHaveBeenCalled();
  });
});
