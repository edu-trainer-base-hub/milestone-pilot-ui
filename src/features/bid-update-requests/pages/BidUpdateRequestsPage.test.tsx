import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { BidUpdateRequestsPage } from "./BidUpdateRequestsPage";
import { getBidUpdateRequest, getBidUpdateRequests } from "../api/bidUpdateRequests";
import type { BidUpdateRequest } from "../model/types";

vi.mock("../api/bidUpdateRequests");

const supersededRequest: BidUpdateRequest = {
  uuid: "request-old",
  version: 2,
  bidUuid: "bid-1",
  sourceEmailUuid: "source-1",
  parsingRunUuid: "run-old",
  supersededByParsingRunUuid: "run-new",
  requestType: "FIELD_CHANGES",
  status: "SUPERSEDED",
  correlationResult: "EXACT_MATCH",
  candidateBidUuids: ["bid-1"],
  correlationExplanation: {},
  resolvedAt: null,
  createdAt: "2026-07-28T10:00:00Z",
  updatedAt: "2026-07-28T11:00:00Z",
  changes: [
    {
      uuid: "change-1",
      version: 0,
      fieldName: "projectName",
      currentValue: "Existing project",
      proposedValue: "Old proposal",
      confidence: 0.9,
      conflictType: "DIFFERING_VALUE",
      resolution: null,
      customValue: null,
      sourceExcerpt: "Bid invitation",
      resolvedAt: null,
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getBidUpdateRequests).mockResolvedValue({
    items: [supersededRequest],
    page: 0,
    size: 100,
    totalElements: 1,
  });
  vi.mocked(getBidUpdateRequest).mockResolvedValue(supersededRequest);
});

describe("BidUpdateRequestsPage", () => {
  it("filters and renders superseded reviews without review actions", async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/tenant/bid-update-requests?status=SUPERSEDED&requestUuid=request-old"]}>
          <BidUpdateRequestsPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(
      await screen.findByText("This request is read-only because parsing run run-new replaced it.")
    ).toBeInTheDocument();
    await waitFor(() => expect(getBidUpdateRequests).toHaveBeenCalledWith("SUPERSEDED", undefined, 0, 100));
    expect(screen.getAllByText("Superseded").length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "Apply resolutions" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reject request" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("combobox")).toHaveLength(1);
  });
});
