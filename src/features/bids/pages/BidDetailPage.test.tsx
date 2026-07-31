import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeBid } from "../model/bid-test-data";
import { BidDetailPage } from "./BidDetailPage";

const bidsApiMock = vi.hoisted(() => ({
  getBid: vi.fn(),
  getBidAudit: vi.fn(),
  getBidSourceEmails: vi.fn(),
  getBidTimeline: vi.fn(),
  transitionBid: vi.fn(),
  updateBid: vi.fn(),
}));

const tenantUsersApiMock = vi.hoisted(() => ({
  getUsersByTenant: vi.fn(),
}));

const authMock = vi.hoisted(() => ({
  principal: {
    activeTenantUuid: "tenant-1",
    authorities: ["TENANT_BIDS_UPDATE", "TENANT_USERS_READ"] as string[],
  },
}));

vi.mock("../api/bids", () => bidsApiMock);
vi.mock("@/features/tenant-users/api/tenantUsers", () => tenantUsersApiMock);
vi.mock("@/contexts/AuthContext", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/contexts/AuthContext")>()),
  useAuth: () => ({ principal: authMock.principal }),
}));
vi.mock("@/services/NotificationService", () => ({
  notifier: { success: vi.fn(), warning: vi.fn(), error: vi.fn() },
}));

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/tenant/bids/11111111-1111-1111-1111-111111111111"]}>
        <Routes>
          <Route path="/tenant/bids/:bidUuid" element={<BidDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("BidDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.principal.authorities = ["TENANT_BIDS_UPDATE", "TENANT_USERS_READ"];
    bidsApiMock.getBid.mockResolvedValue(makeBid());
    bidsApiMock.getBidAudit.mockResolvedValue([]);
    bidsApiMock.getBidSourceEmails.mockResolvedValue([]);
    bidsApiMock.getBidTimeline.mockResolvedValue([]);
    tenantUsersApiMock.getUsersByTenant.mockResolvedValue([]);
  });

  it("opens a complete edit form and submits changed values with explicit clears", async () => {
    bidsApiMock.updateBid.mockResolvedValue(
      makeBid({ projectDescription: "Revised project description", rfiDeadlineAt: null })
    );
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Edit" }));
    fireEvent.change(screen.getByLabelText("Project description"), {
      target: { value: "Revised project description" },
    });
    fireEvent.change(screen.getByLabelText("RFI deadline"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(bidsApiMock.updateBid).toHaveBeenCalledWith(
        "11111111-1111-1111-1111-111111111111",
        expect.objectContaining({
          version: 7,
          projectDescription: "Revised project description",
          clearFields: expect.arrayContaining(["rfiDeadlineAt"]),
        })
      )
    );
  });

  it("keeps the complete details read-only without update authority", async () => {
    authMock.principal.authorities = [];
    renderPage();

    expect((await screen.findAllByText("Central Library Expansion")).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("System record")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
  });
});
