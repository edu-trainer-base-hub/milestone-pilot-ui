import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PlatformUsersPage } from "./PlatformUsersPage";
import { PlatformUserUpsertPage } from "./PlatformUserUpsertPage";

const apiMock = vi.hoisted(() => ({
  getPlatformUsers: vi.fn(),
  createPlatformUser: vi.fn(),
  updatePlatformUser: vi.fn(),
}));

const notifierMock = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}));

const authMock = vi.hoisted(() => ({
  principal: {
    authorities: [] as string[],
  },
}));

vi.mock("../api/platformUsers", () => ({
  getPlatformUsers: apiMock.getPlatformUsers,
  createPlatformUser: apiMock.createPlatformUser,
  updatePlatformUser: apiMock.updatePlatformUser,
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

const renderWithRouter = (initialEntry: string) => {
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
          <Route path="/platform/users" element={<PlatformUsersPage />} />
          <Route path="/platform/users/new" element={<PlatformUserUpsertPage />} />
          <Route path="/platform/users/:userId/edit" element={<PlatformUserUpsertPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe("Platform user management", () => {
  beforeEach(() => {
    apiMock.getPlatformUsers.mockReset();
    apiMock.createPlatformUser.mockReset();
    apiMock.updatePlatformUser.mockReset();
    notifierMock.success.mockReset();
    notifierMock.error.mockReset();
    authMock.principal.authorities = [];
  });

  it("renders the platform user list and hides edit for rows without matching update authority", async () => {
    authMock.principal.authorities = ["PLATFORM_MANAGERS_READ", "PLATFORM_MANAGERS_UPDATE"];
    apiMock.getPlatformUsers.mockResolvedValue([
      {
        uuid: "user-admin",
        email: "admin@example.com",
        firstName: "Ada",
        lastName: "Lovelace",
        platformRole: "ROLE_PLATFORM_ADMIN",
      },
      {
        uuid: "user-manager",
        email: "manager@example.com",
        firstName: "Grace",
        lastName: "Hopper",
        platformRole: "ROLE_PLATFORM_MANAGER",
      },
    ]);

    renderWithRouter("/platform/users");

    expect(await screen.findByText("admin@example.com")).toBeInTheDocument();
    expect(screen.getByText("PLATFORM ADMIN")).toBeInTheDocument();

    const adminRow = screen.getByText("admin@example.com").closest("tr");
    const managerRow = screen.getByText("manager@example.com").closest("tr");

    expect(adminRow).not.toBeNull();
    expect(managerRow).not.toBeNull();
    expect(within(adminRow as HTMLElement).queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
    expect(within(managerRow as HTMLElement).getByRole("button", { name: "Edit" })).toBeInTheDocument();
  });

  it("exposes only creatable platform roles in the create form", async () => {
    authMock.principal.authorities = ["PLATFORM_MANAGERS_CREATE"];
    apiMock.createPlatformUser.mockResolvedValue({
      uuid: "user-2",
    });

    renderWithRouter("/platform/users/new");

    fireEvent.change(await screen.findByLabelText("Email"), { target: { value: "manager@example.com" } });
    fireEvent.change(screen.getByLabelText("First Name"), { target: { value: "Grace" } });
    fireEvent.change(screen.getByLabelText("Last Name"), { target: { value: "Hopper" } });

    const roleSelect = screen.getByRole("combobox");
    expect(roleSelect).toHaveTextContent("PLATFORM MANAGER");
    fireEvent.click(roleSelect);
    const listbox = await screen.findByRole("listbox");
    expect(within(listbox).getByRole("option", { name: "PLATFORM MANAGER" })).toBeInTheDocument();
    expect(within(listbox).queryByRole("option", { name: "PLATFORM ADMIN" })).not.toBeInTheDocument();
    fireEvent.keyDown(listbox, { key: "Escape" });

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(apiMock.createPlatformUser).toHaveBeenCalledWith({
        email: "manager@example.com",
        firstName: "Grace",
        lastName: "Hopper",
        role: "ROLE_PLATFORM_MANAGER",
      })
    );
    expect(notifierMock.success).toHaveBeenCalled();
  });

  it("wires platform user updates", async () => {
    authMock.principal.authorities = ["PLATFORM_MANAGERS_READ", "PLATFORM_MANAGERS_UPDATE"];
    apiMock.getPlatformUsers.mockResolvedValue([
      {
        uuid: "user-1",
        email: "manager@example.com",
        firstName: "Grace",
        lastName: "Hopper",
        platformRole: "ROLE_PLATFORM_MANAGER",
      },
    ]);
    apiMock.updatePlatformUser.mockResolvedValue({
      uuid: "user-1",
    });

    renderWithRouter("/platform/users/user-1/edit");

    expect(await screen.findByDisplayValue("Grace")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveAttribute("readonly");

    fireEvent.change(screen.getByLabelText("First Name"), { target: { value: "Updated Grace" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(apiMock.updatePlatformUser).toHaveBeenCalledWith("user-1", {
        firstName: "Updated Grace",
        lastName: "Hopper",
        role: "ROLE_PLATFORM_MANAGER",
      })
    );
    expect(notifierMock.success).toHaveBeenCalled();
  });

  it("does not unlock create access from legacy role strings alone", async () => {
    authMock.principal.authorities = [];

    renderWithRouter("/platform/users/new");

    expect(await screen.findByText("Platform user not found.")).toBeInTheDocument();
    expect(apiMock.createPlatformUser).not.toHaveBeenCalled();
  });
});
