import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, useLocation } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { getBids, getBidDashboard } from "../api/bids";
import { makeBid } from "../model/bid-test-data";
import { BidsPage } from "./BidsPage";

vi.mock("../api/bids");
vi.mock("@/contexts/AuthContext", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/contexts/AuthContext")>()),
  useAuth: () => ({ principal: { authorities: [] } }),
}));

function LocationDisplay() {
  return <output aria-label="Current location">{useLocation().search}</output>;
}

describe("BidsPage readiness", () => {
  it("shows review flags and field warnings without marking unaffected bids as needing review", async () => {
    vi.mocked(getBidDashboard).mockResolvedValue({
      open: 3,
      dueSoon: 0,
      overdue: 0,
      pendingReview: 2,
      submitted: 0,
      awarded: 0,
      recentParsingFailures: 0,
    });
    vi.mocked(getBids).mockResolvedValue({
      items: [
        makeBid({
          projectName: "Needs review",
          reviewStatus: "NONE",
          requiresReview: true,
          fieldAlerts: [
            {
              fieldName: "bidDueAt",
              updateRequestUuid: "request-1",
              changeUuid: "change-1",
              provisionallyApplied: true,
              timestampNormalization: {
                rawValue: null,
                sourceText: null,
                sourceTimezone: null,
                timezoneUsed: "UTC",
                resolvedValue: null,
                assumptions: [],
                unresolvedReasons: ["INVALID_DATE_TIME"],
              },
            },
          ],
        }),
        makeBid({ uuid: "bid-2", projectName: "Being reviewed", reviewStatus: "IN_REVIEW" }),
        makeBid({ uuid: "bid-3", projectName: "No issues", reviewStatus: "NONE", requiresReview: false }),
      ],
      page: 0,
      size: 20,
      totalElements: 43,
    });
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter initialEntries={["/?status=PURSUING&sort=updatedAt&direction=ASC&page=0"]}>
          <BidsPage />
          <LocationDisplay />
        </MemoryRouter>
      </QueryClientProvider>
    );
    const row = within(await screen.findByRole("row", { name: /Needs review/ }));
    expect(row.getByText("Review required")).toHaveClass("bg-yellow-100");
    const trigger = row.getByRole("button", { name: "Timestamp warnings (1)" });
    expect(trigger).toHaveClass("bg-yellow-100");
    expect(row.queryByText("Timestamp warnings (1)")).not.toBeInTheDocument();
    const reviewing = within(screen.getByRole("row", { name: /Being reviewed/ }));
    expect(reviewing.getByText("In review")).toHaveClass("bg-blue-50");
    expect(reviewing.queryByText("Review required")).not.toBeInTheDocument();
    expect(within(screen.getByRole("row", { name: /No issues/ })).getByText("None")).toHaveClass("text-foreground");
    await waitFor(() => expect(screen.getByLabelText("Current location")).toHaveTextContent("page=0"));
    fireEvent.click(screen.getAllByRole("button").find((button) => button.querySelector(".lucide-chevron-right"))!);
    await waitFor(() => expect(screen.getByLabelText("Current location")).toHaveTextContent("page=1"));
    const locationBeforePopup = screen.getByLabelText("Current location").textContent;
    const nextPageRow = within(await screen.findByRole("row", { name: /Needs review/ }));
    fireEvent.click(nextPageRow.getByRole("button", { name: "Timestamp warnings (1)" }));
    const dialog = within(await screen.findByRole("dialog", { name: "Timestamp warnings (1)" }));
    expect(dialog.getByRole("heading", { name: "Bid deadline" })).toBeInTheDocument();
    expect(dialog.getByRole("link", { name: "Review this field" })).toHaveAttribute(
      "href",
      "/tenant/bid-update-requests?requestUuid=request-1"
    );
    expect(screen.getByLabelText("Current location")).toHaveTextContent(locationBeforePopup!);
    fireEvent.click(dialog.getByRole("button", { name: "Close alerts" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByLabelText("Current location")).toHaveTextContent(locationBeforePopup!);
  });
});
