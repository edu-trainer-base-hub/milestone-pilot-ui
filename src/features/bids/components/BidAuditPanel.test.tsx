import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { getBidAudit, getBidAuditDetail } from "../api/bids";
import { BidAuditPanel } from "./BidAuditPanel";

vi.mock("../api/bids");

const actor = {
  type: "USER" as const,
  userUuid: "user-1",
  displayName: "Taylor Manager",
  email: "taylor@example.com",
};

describe("BidAuditPanel", () => {
  it("renders friendly old-to-new field changes and keeps raw JSON available", async () => {
    vi.mocked(getBidAudit).mockResolvedValue({
      items: [
        {
          id: 17,
          sourceTable: "bids",
          rowId: 1,
          rowUuid: "bid-1",
          operation: "UPDATE",
          changedFields: ["project_name"],
          databaseUser: "application",
          transactionId: 10,
          changedAt: "2026-08-01T10:00:00Z",
          actor,
        },
      ],
      page: 0,
      size: 20,
      totalElements: 1,
    });
    vi.mocked(getBidAuditDetail).mockResolvedValue({
      id: 17,
      sourceTable: "bids",
      operation: "UPDATE",
      changedFields: ["project_name"],
      oldRow: { project_name: "Old library" },
      newRow: { project_name: "New library" },
      applicationActorType: "USER",
      applicationActorUuid: "user-1",
      databaseUser: "application",
      transactionId: 10,
      changedAt: "2026-08-01T10:00:00Z",
      actor,
    });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <BidAuditPanel bidUuid="bid-1" />
        </MemoryRouter>
      </QueryClientProvider>
    );

    fireEvent.click(await screen.findByText("Bid"));
    expect(await screen.findByText("Old library")).toBeInTheDocument();
    expect(screen.getByText("New library")).toBeInTheDocument();
    expect(screen.getByText("Project")).toBeInTheDocument();
    expect(screen.getAllByText("Taylor Manager").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "View raw data" }));
    expect(screen.getByText(/"project_name": "Old library"/)).toBeInTheDocument();
  });
});
