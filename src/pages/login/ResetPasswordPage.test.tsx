import i18n from "@/i18n";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ResetPasswordPage from "./ResetPasswordPage";

const authMock = vi.hoisted(() => ({
  sendConfirmationCode: vi.fn(),
  doResetPassword: vi.fn(),
}));

const notifierMock = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock("@/contexts/AuthContext.tsx", async () => {
  const actual = await vi.importActual<typeof import("@/contexts/AuthContext.tsx")>("@/contexts/AuthContext.tsx");
  return {
    ...actual,
    useAuth: () => ({
      sendConfirmationCode: authMock.sendConfirmationCode,
      doResetPassword: authMock.doResetPassword,
    }),
  };
});

vi.mock("@/services/NotificationService.ts", () => ({
  notifier: {
    success: notifierMock.success,
    error: notifierMock.error,
  },
}));

const renderPage = (initialEntry: string) =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/password/reset" element={<ResetPasswordPage />} />
        <Route path="/login" element={<div>Login Route</div>} />
      </Routes>
    </MemoryRouter>
  );

describe("ResetPasswordPage", () => {
  beforeEach(async () => {
    authMock.sendConfirmationCode.mockReset();
    authMock.doResetPassword.mockReset();
    notifierMock.success.mockReset();
    notifierMock.error.mockReset();
    await i18n.changeLanguage("en");
  });

  it("submits a standard password reset flow and links back to login", async () => {
    authMock.sendConfirmationCode.mockResolvedValue(undefined);
    authMock.doResetPassword.mockResolvedValue(undefined);

    renderPage("/password/reset");

    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login");

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "user@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Send reset code" }));

    await waitFor(() => {
      expect(authMock.sendConfirmationCode).toHaveBeenCalledWith(
        "user@example.com",
        "PASSWORD_RESET_EMAIL_VERIFICATION_CODE_WEB"
      );
    });

    expect(screen.getByRole("button", { name: "Resend in 60 s" })).toBeDisabled();

    fireEvent.change(await screen.findByLabelText("Confirmation Code"), { target: { value: "123456" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "Valid123!" } });
    fireEvent.change(screen.getByLabelText("Confirm Password"), { target: { value: "Valid123!" } });
    fireEvent.click(screen.getByRole("button", { name: "Reset Password" }));

    await waitFor(() => {
      expect(authMock.doResetPassword).toHaveBeenCalledWith("user@example.com", "Valid123!", "Valid123!", "123456");
    });

    expect(await screen.findByText("Login Route")).toBeInTheDocument();
  });

  it("shows reset-password validation messages without registration translations", async () => {
    renderPage("/password/reset");

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "invalid-email" } });
    expect(screen.getByText("Invalid email address")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "Valid123!" } });
    fireEvent.change(screen.getByLabelText("Confirm Password"), { target: { value: "Different123!" } });
    expect(screen.getAllByText("Passwords do not match")).not.toHaveLength(0);
  });

  it("preserves tenant account setup mode without the send-code step", async () => {
    authMock.doResetPassword.mockResolvedValue(undefined);

    renderPage("/password/reset?mode=tenant-account-setup&email=invite@example.com&code=654321");

    expect(screen.getByText("Set your password")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveValue("invite@example.com");
    expect(screen.getByLabelText("Email")).toHaveAttribute("readonly");
    expect(screen.queryByRole("button", { name: "Send reset code" })).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "Valid123!" } });
    fireEvent.change(screen.getByLabelText("Confirm Password"), { target: { value: "Valid123!" } });
    fireEvent.click(screen.getByRole("button", { name: "Set Password" }));

    await waitFor(() => {
      expect(authMock.sendConfirmationCode).not.toHaveBeenCalled();
      expect(authMock.doResetPassword).toHaveBeenCalledWith("invite@example.com", "Valid123!", "Valid123!", "654321");
    });

    expect(await screen.findByText("Login Route")).toBeInTheDocument();
  });
});
