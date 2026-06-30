import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

vi.mock("@/layout/CommonLayout.tsx", () => ({
  default: ({ children }: { children?: ReactNode }) => <>{children}</>,
}));

vi.mock("@/layout/DefaultLayout.tsx", () => ({
  default: ({ children }: { children?: ReactNode }) => <>{children}</>,
}));

vi.mock("./layout/WebLayout.tsx", () => ({
  default: ({ children }: { children?: ReactNode }) => <>{children}</>,
}));

vi.mock("@/pages/login/LoginPage.tsx", () => ({
  default: () => <div>Login Page</div>,
}));

vi.mock("@/pages/login/ResetPasswordPage.tsx", () => ({
  default: () => <div>Reset Password Page</div>,
}));

vi.mock("@/pages/SettingsPage.tsx", () => ({
  default: () => <div>Settings Page</div>,
}));

vi.mock("@/pages/subscriptions/SubscriptionPage.tsx", () => ({
  default: () => <div>Subscription Page</div>,
}));

vi.mock("@/features/tenants/pages", () => ({
  PlatformUserUpsertPage: () => <div>Platform User Upsert Page</div>,
  PlatformUsersPage: () => <div>Platform Users Page</div>,
  TenantMembershipsPage: () => <div>Tenant Memberships Page</div>,
  TenantsPage: () => <div>Tenants Page</div>,
  TenantUsersPage: () => <div>Tenant Users Page</div>,
}));

vi.mock("@/components/PrivateRoute.tsx", () => ({
  default: () => <div>Private Route</div>,
}));

vi.mock("@/components/AuthorityRoute.tsx", () => ({
  default: () => <div>Authority Route</div>,
}));

vi.mock("@/hooks/usePageTitle.ts", () => ({
  usePageTitle: vi.fn(),
}));

const renderApp = (initialEntry: string) =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <App />
    </MemoryRouter>
  );

describe("App public auth routes", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders /login", async () => {
    renderApp("/login");

    expect(await screen.findByText("Login Page")).toBeInTheDocument();
  });

  it("renders /telegram/login", async () => {
    renderApp("/telegram/login");

    expect(await screen.findByText("Login Page")).toBeInTheDocument();
  });

  it("renders /password/reset", async () => {
    renderApp("/password/reset");

    expect(await screen.findByText("Reset Password Page")).toBeInTheDocument();
  });

  it("redirects unmatched legacy /register requests to the public auth default", async () => {
    renderApp("/register");

    expect(await screen.findByText("Вітаємо у Milestone Pilot!")).toBeInTheDocument();
  });
});
