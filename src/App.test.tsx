import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AuthorityRoute from "@/components/AuthorityRoute";

const authMock = vi.hoisted(() => ({
  Authority: {
    UI_PLATFORM_TENANTS_VIEW: "UI_PLATFORM_TENANTS_VIEW",
    UI_PLATFORM_USERS_VIEW: "UI_PLATFORM_USERS_VIEW",
    UI_TENANT_USERS_VIEW: "UI_TENANT_USERS_VIEW",
  } as const,
  state: {
    principal: null as { authorities: string[] } | null,
  },
}));

vi.mock("@/contexts/AuthContext.tsx", () => ({
  Authority: authMock.Authority,
  useAuth: () => ({
    principal: authMock.state.principal,
  }),
}));

const renderProtectedRoute = (path: string, authority: string, authorities: string[], protectedLabel: string) => {
  authMock.state.principal = {
    authorities,
  };

  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={<div>Home Page</div>} />
        <Route element={<AuthorityRoute authority={authority as never} />}>
          <Route path={path} element={<div>{protectedLabel}</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
};

describe("authority-gated routes", () => {
  beforeEach(() => {
    authMock.state.principal = null;
  });

  it("renders the platform users route only with UI_PLATFORM_USERS_VIEW", async () => {
    renderProtectedRoute(
      "/platform/users",
      authMock.Authority.UI_PLATFORM_USERS_VIEW,
      [authMock.Authority.UI_PLATFORM_USERS_VIEW],
      "Platform Users Page"
    );

    expect(await screen.findByText("Platform Users Page")).toBeInTheDocument();
  });

  it("redirects the platform users route without UI_PLATFORM_USERS_VIEW", async () => {
    renderProtectedRoute("/platform/users", authMock.Authority.UI_PLATFORM_USERS_VIEW, [], "Platform Users Page");

    expect(await screen.findByText("Home Page")).toBeInTheDocument();
    expect(screen.queryByText("Platform Users Page")).not.toBeInTheDocument();
  });

  it("renders the platform tenants route only with UI_PLATFORM_TENANTS_VIEW", async () => {
    renderProtectedRoute(
      "/platform/tenants",
      authMock.Authority.UI_PLATFORM_TENANTS_VIEW,
      [authMock.Authority.UI_PLATFORM_TENANTS_VIEW],
      "Platform Tenants Page"
    );

    expect(await screen.findByText("Platform Tenants Page")).toBeInTheDocument();
  });

  it("redirects the platform tenants route without UI_PLATFORM_TENANTS_VIEW", async () => {
    renderProtectedRoute("/platform/tenants", authMock.Authority.UI_PLATFORM_TENANTS_VIEW, [], "Platform Tenants Page");

    expect(await screen.findByText("Home Page")).toBeInTheDocument();
    expect(screen.queryByText("Platform Tenants Page")).not.toBeInTheDocument();
  });

  it("renders the tenant users route only with UI_TENANT_USERS_VIEW", async () => {
    renderProtectedRoute(
      "/platform/tenants/tenant-1/users",
      authMock.Authority.UI_TENANT_USERS_VIEW,
      [authMock.Authority.UI_TENANT_USERS_VIEW],
      "Tenant Users Page"
    );

    expect(await screen.findByText("Tenant Users Page")).toBeInTheDocument();
  });

  it("redirects the tenant users route without UI_TENANT_USERS_VIEW", async () => {
    renderProtectedRoute(
      "/platform/tenants/tenant-1/users",
      authMock.Authority.UI_TENANT_USERS_VIEW,
      [],
      "Tenant Users Page"
    );

    expect(await screen.findByText("Home Page")).toBeInTheDocument();
    expect(screen.queryByText("Tenant Users Page")).not.toBeInTheDocument();
  });
});
