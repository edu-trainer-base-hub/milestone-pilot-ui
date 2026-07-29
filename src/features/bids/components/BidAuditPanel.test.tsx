import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
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
  beforeEach(() => vi.resetAllMocks());

  it("renders friendly old-to-new field changes and keeps raw JSON available", async () => {
    vi.mocked(getBidAudit).mockResolvedValue({
      items: [
        {
          id: 17,
          sourceTable: "bids",
          rowId: 1,
          rowUuid: "bid-1",
          operation: "UPDATE",
          changedFields: ["project_name", "status", "priority", "scope_summary"],
          relatedFieldName: null,
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
    expect(screen.getByText("Project, Status, Priority +1 more")).toBeInTheDocument();
    expect(await screen.findByText("Old library")).toBeInTheDocument();
    expect(screen.getByText("New library")).toBeInTheDocument();
    expect(screen.getAllByText("Project").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Taylor Manager").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "View raw data" }));
    expect(screen.getByText(/"project_name": "Old library"/)).toBeInTheDocument();
  });

  it("leads with the related business field for field-scoped audit rows", async () => {
    vi.mocked(getBidAudit).mockResolvedValue({
      items: [
        {
          id: 18,
          sourceTable: "bid_field_sources",
          rowId: 2,
          rowUuid: "source-1",
          operation: "INSERT",
          changedFields: [
            "id",
            "uuid",
            "bid_id",
            "field_name",
            "source_type",
            "source_email_id",
            "parsing_run_id",
            "update_request_id",
            "accepted_by_user_uuid",
            "manually_overridden",
            "accepted_at",
            "version",
            "created_at",
            "updated_at",
            "created_by_actor_type",
            "updated_by_actor_type",
          ],
          relatedFieldName: "projectName",
          databaseUser: "application",
          transactionId: 11,
          changedAt: "2026-08-01T10:05:00Z",
          actor,
        },
      ],
      page: 0,
      size: 20,
      totalElements: 1,
    });
    vi.mocked(getBidAuditDetail).mockResolvedValue({
      id: 18,
      sourceTable: "bid_field_sources",
      operation: "INSERT",
      changedFields: ["field_name"],
      oldRow: null,
      newRow: { field_name: "projectName" },
      applicationActorType: "USER",
      applicationActorUuid: "user-1",
      databaseUser: "application",
      transactionId: 11,
      changedAt: "2026-08-01T10:05:00Z",
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

    fireEvent.click(await screen.findByText("Project"));
    expect(screen.getAllByText("Field provenance").length).toBeGreaterThan(0);
    expect(screen.queryByText("16 changed fields")).not.toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "View raw data" })).toBeInTheDocument();
    expect(screen.getAllByText("Project").length).toBeGreaterThan(1);
  });
});
