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
        id: "tenant-1",
        name: "Alpha",
        description: "Primary tenant",
        email: "alpha@example.com",
        address: "Main street",
        timezone: "UTC",
        locale: "en",
        status: "ACTIVE",
      },
    ]);
    apiMock.createTenant.mockResolvedValue({
      id: "tenant-2",
    });

    renderPage();

    expect(await screen.findByText("Alpha")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Create Tenant" }));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Beta" } });
    fireEvent.change(screen.getByLabelText("Admin's Email"), { target: { value: "beta@example.com" } });
    fireEvent.change(screen.getByLabelText("Address"), { target: { value: "Tenant address" } });
    fireEvent.change(screen.getByLabelText("Description"), { target: { value: "Beta description" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(apiMock.createTenant).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Beta",
          email: "beta@example.com",
          address: "Tenant address",
          description: "Beta description",
        })
      )
    );
    expect(notifierMock.success).toHaveBeenCalled();
  });

  it("wires tenant updates through the edit dialog", async () => {
    apiMock.getAllTenants.mockResolvedValue([
      {
        id: "tenant-1",
        name: "Alpha",
        description: "Primary tenant",
        email: "alpha@example.com",
        address: "Main street",
        timezone: "UTC",
        locale: "en",
        status: "ACTIVE",
      },
    ]);
    apiMock.updateTenant.mockResolvedValue({
      id: "tenant-1",
    });

    renderPage();

    expect(await screen.findByText("Alpha")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Alpha Updated" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(apiMock.updateTenant).toHaveBeenCalledWith(
        "tenant-1",
        expect.objectContaining({
          name: "Alpha Updated",
        })
      )
    );
    expect(notifierMock.success).toHaveBeenCalled();
  });
});
