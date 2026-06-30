import i18n from "@/i18n";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LoginPage from "./LoginPage";

const authMock = vi.hoisted(() => ({
  login: vi.fn(),
}));

vi.mock("@/contexts/AuthContext.tsx", () => ({
  useAuth: () => ({
    login: authMock.login,
  }),
}));

vi.mock("@/services/NotificationService.ts", () => ({
  notifier: {
    error: vi.fn(),
  },
}));

describe("LoginPage", () => {
  beforeEach(async () => {
    authMock.login.mockReset();
    await i18n.changeLanguage("en");
  });

  it("does not render a public signup link", () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    expect(screen.getByText("Sign in to your account")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Forgot password?" })).toHaveAttribute("href", "/password/reset");
    expect(screen.queryByRole("link", { name: "Sign up" })).not.toBeInTheDocument();
    expect(screen.queryByText("Don't have an account?")).not.toBeInTheDocument();
  });
});
