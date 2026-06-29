import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TenantsPage } from "./TenantsPage";

const apiMock = vi.hoisted(() => ({
  getAllTenants: vi.fn(),
  createTenant: vi.fn(),
  updateTenant: vi.fn(),
}));

const notifierMock = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock("../api", () => ({
  getAllTenants: apiMock.getAllTenants,
  createTenant: apiMock.createTenant,
  updateTenant: apiMock.updateTenant,
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
      <MemoryRouter>
        <TenantsPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe("TenantsPage", () => {
  beforeEach(() => {
    apiMock.getAllTenants.mockReset();
    apiMock.createTenant.mockReset();
    apiMock.updateTenant.mockReset();
    notifierMock.success.mockReset();
    notifierMock.error.mockReset();
  });

  it("renders tenants and wires tenant creation", async () => {
    apiMock.getAllTenants.mockResolvedValue([
      {
        id: 1,
        uuid: "tenant-uuid-1",
        name: "Alpha",
        email: "alpha@example.com",
        address: "Main street",
        timezone: "UTC",
        locale: "en",
        status: "ACTIVE",
      },
    ]);
    apiMock.createTenant.mockResolvedValue({
      id: 2,
      uuid: "tenant-uuid-2",
    });

    renderPage();

    expect(await screen.findByText("Alpha")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Tenant Users" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Create Tenant" }));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Beta" } });
    fireEvent.change(screen.getByLabelText("Admin's Email"), { target: { value: "beta@example.com" } });
    fireEvent.change(screen.getByLabelText("Address"), { target: { value: "Tenant address" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(apiMock.createTenant).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Beta",
          email: "beta@example.com",
          address: "Tenant address",
          locale: "en",
          status: "ACTIVE",
        })
      )
    );
    expect(apiMock.createTenant.mock.calls[0]?.[0]).not.toHaveProperty("description");
    expect(notifierMock.success).toHaveBeenCalled();
  });

  it("wires tenant updates through the edit dialog", async () => {
    apiMock.getAllTenants.mockResolvedValue([
      {
        id: 1,
        uuid: "tenant-uuid-1",
        name: "Alpha",
        email: "alpha@example.com",
        address: "Main street",
        timezone: "UTC",
        locale: "en",
        status: "ACTIVE",
      },
    ]);
    apiMock.updateTenant.mockResolvedValue({
      id: 1,
      uuid: "tenant-uuid-1",
    });

    renderPage();

    expect(await screen.findByText("Alpha")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByLabelText("Admin's Email")).toHaveAttribute("readonly");
    expect(screen.getByLabelText("Timezone")).toHaveAttribute("readonly");
    expect(screen.getByLabelText("Locale")).toHaveAttribute("readonly");
    expect(screen.getByLabelText("Status")).toHaveAttribute("readonly");
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Alpha Updated" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(apiMock.updateTenant).toHaveBeenCalledWith("1", {
        name: "Alpha Updated",
        address: "Main street",
      })
    );
    expect(notifierMock.success).toHaveBeenCalled();
  });
});
