import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import FeatureFlagRoute from "./FeatureFlagRoute";
import { FeatureFlag } from "@/services/FeatureFlagService";

const flagsMock = vi.hoisted(() => ({
  state: {
    enabledFlags: [] as string[],
    isLoading: false,
  },
}));

vi.mock("@/hooks/useFeatureFlags", () => ({
  useFeatureFlags: () => ({
    isFeatureEnabled: (flag: string) => flagsMock.state.enabledFlags.includes(flag),
    isLoading: flagsMock.state.isLoading,
  }),
}));

const renderGuardedRoute = () =>
  render(
    <MemoryRouter initialEntries={["/guarded"]}>
      <Routes>
        <Route path="/" element={<div>Home Page</div>} />
        <Route element={<FeatureFlagRoute flag={FeatureFlag.EMAIL_PARSING_LAB} />}>
          <Route path="/guarded" element={<div>Guarded Page</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );

describe("FeatureFlagRoute", () => {
  it("renders the child route when the flag is enabled", async () => {
    flagsMock.state.enabledFlags = [FeatureFlag.EMAIL_PARSING_LAB];
    flagsMock.state.isLoading = false;

    renderGuardedRoute();

    expect(await screen.findByText("Guarded Page")).toBeInTheDocument();
  });

  it("redirects home when the flag is disabled", async () => {
    flagsMock.state.enabledFlags = [];
    flagsMock.state.isLoading = false;

    renderGuardedRoute();

    expect(await screen.findByText("Home Page")).toBeInTheDocument();
    expect(screen.queryByText("Guarded Page")).not.toBeInTheDocument();
  });

  it("renders nothing while flags are loading", () => {
    flagsMock.state.enabledFlags = [];
    flagsMock.state.isLoading = true;

    renderGuardedRoute();

    expect(screen.queryByText("Guarded Page")).not.toBeInTheDocument();
    expect(screen.queryByText("Home Page")).not.toBeInTheDocument();
  });
});
