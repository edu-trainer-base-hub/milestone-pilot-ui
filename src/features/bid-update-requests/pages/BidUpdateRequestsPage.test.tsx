import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { BidUpdateRequestsPage } from "./BidUpdateRequestsPage";
import {
  applyBidUpdateRequest,
  getBidUpdateRequest,
  getBidUpdateRequests,
  rejectBidUpdateRequest,
} from "../api/bidUpdateRequests";
import type { BidUpdateRequest } from "../model/types";

const actor = { type: "USER" as const, userUuid: "user-1", displayName: "Taylor Manager", email: "taylor@example.com" };

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
  createdBy: actor,
  assignedReviewer: null,
  resolvedBy: null,
  changes: [
    {
      uuid: "change-1",
      version: 0,
      fieldName: "projectName",
      currentValue: "Existing project",
      proposedValue: "Old proposal",
      acceptProposedAllowed: true,
      confidence: 0.9,
      conflictType: "DIFFERING_VALUE",
      resolution: null,
      customValue: null,
      sourceExcerpt: "Bid invitation",
      resolvedAt: null,
      resolvedBy: null,
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getBidUpdateRequests).mockResolvedValue({
    items: [supersededRequest],
    page: 0,
    size: 20,
    totalElements: 1,
  });
  vi.mocked(getBidUpdateRequest).mockResolvedValue(supersededRequest);
});

describe("BidUpdateRequestsPage", () => {
  it("keeps timestamp evidence neutral in an applied review", async () => {
    vi.mocked(getBidUpdateRequest).mockResolvedValue({
      ...supersededRequest,
      status: "APPLIED",
      changes: [
        {
          ...supersededRequest.changes[0],
          resolution: "KEEP_CURRENT",
          timestampNormalization: {
            rawValue: "2026-09-01",
            sourceText: "Due September 1",
            sourceTimezone: null,
            timezoneUsed: "UTC",
            resolvedValue: "2026-09-01T00:00:00Z",
            assumptions: ["TIME_DEFAULTED_TO_MIDNIGHT"],
            unresolvedReasons: [],
          },
        },
      ],
    });
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter initialEntries={["/?requestUuid=request-old"]}>
          <BidUpdateRequestsPage />
        </MemoryRouter>
      </QueryClientProvider>
    );
    expect(await screen.findByRole("note")).toHaveTextContent("Due September 1");
    expect(screen.getByRole("note")).not.toHaveClass("bg-yellow-50");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByText("Applied")).toHaveClass("bg-green-50");
    expect(screen.getByText("Conflicting value")).toHaveClass("text-foreground");
  });

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
    await waitFor(() => expect(getBidUpdateRequests).toHaveBeenCalledWith("SUPERSEDED", undefined, 0, 20));
    expect(screen.getAllByText("Superseded").length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "Apply resolutions" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reject request" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("combobox")).toHaveLength(1);
  });

  it("shows assumptions and confirms the canonical timestamp through the existing review API", async () => {
    const pending: BidUpdateRequest = {
      ...supersededRequest,
      status: "PENDING",
      supersededByParsingRunUuid: null,
      changes: [
        {
          ...supersededRequest.changes[0],
          fieldName: "bidDueAt",
          provisionallyApplied: true,
          currentValue: null,
          proposedValue: "2026-09-01T07:00:00Z",
          timestampNormalization: {
            rawValue: "2026-09-01",
            sourceText: "Due September 1",
            sourceTimezone: null,
            timezoneUsed: "America/Los_Angeles",
            resolvedValue: "2026-09-01T07:00:00Z",
            assumptions: ["TIME_DEFAULTED_TO_MIDNIGHT", "TIMEZONE_FROM_TENANT"],
            unresolvedReasons: [],
          },
        },
      ],
    };
    vi.mocked(getBidUpdateRequest).mockResolvedValue(pending);
    vi.mocked(applyBidUpdateRequest).mockResolvedValue({ ...pending, status: "APPLIED" });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/tenant/bid-update-requests?requestUuid=request-old"]}>
          <BidUpdateRequestsPage />
        </MemoryRouter>
      </QueryClientProvider>
    );
    expect((await screen.findByText("Due September 1")).closest('[role="alert"]')).toHaveClass("bg-yellow-50");
    expect(screen.getByText("The time was missing. Midnight (00:00) was assumed.")).toBeInTheDocument();
    expect(await screen.findByText("Confirm assumed value")).toBeInTheDocument();
    expect(
      screen.getByText("Rejecting this request clears its unconfirmed provisional timestamps.")
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Apply resolutions" }));
    await waitFor(() =>
      expect(applyBidUpdateRequest).toHaveBeenCalledWith("request-old", {
        version: 2,
        changes: [{ changeUuid: "change-1", resolution: "ACCEPT_PROPOSED", customValue: null }],
      })
    );
  });

  it("rejects provisional values through the existing reject action", async () => {
    const pending: BidUpdateRequest = {
      ...supersededRequest,
      status: "PENDING",
      supersededByParsingRunUuid: null,
      changes: [{ ...supersededRequest.changes[0], provisionallyApplied: true }],
    };
    vi.mocked(getBidUpdateRequest).mockResolvedValue(pending);
    vi.mocked(rejectBidUpdateRequest).mockResolvedValue({ ...pending, status: "REJECTED" });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/tenant/bid-update-requests?requestUuid=request-old"]}>
          <BidUpdateRequestsPage />
        </MemoryRouter>
      </QueryClientProvider>
    );
    fireEvent.click(await screen.findByRole("button", { name: "Reject request" }));
    await waitFor(() => expect(rejectBidUpdateRequest).toHaveBeenCalledWith("request-old", 2));
  });

  it("requires keep-current or a custom value when the proposal cannot be applied", async () => {
    const ambiguousRequest: BidUpdateRequest = {
      ...supersededRequest,
      uuid: "request-pending",
      version: 0,
      status: "PENDING",
      supersededByParsingRunUuid: null,
      changes: [
        {
          ...supersededRequest.changes[0],
          uuid: "change-time",
          fieldName: "bidDueAt",
          proposedValue: "2026-09-01T15:00:00",
          acceptProposedAllowed: false,
          conflictType: "AMBIGUOUS_TIME",
        },
      ],
    };
    vi.mocked(getBidUpdateRequests).mockResolvedValue({
      items: [ambiguousRequest],
      page: 0,
      size: 20,
      totalElements: 1,
    });
    vi.mocked(getBidUpdateRequest).mockResolvedValue(ambiguousRequest);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/tenant/bid-update-requests?requestUuid=request-pending"]}>
          <BidUpdateRequestsPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(
      await screen.findByText(
        "This parsed value cannot be applied directly. Keep the current value or enter a valid custom value."
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Keep current")).toBeInTheDocument();
    expect(screen.queryByText("Accept proposed")).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveClass("bg-yellow-50");
    expect(screen.getAllByText("Pending").filter((element) => element.matches('[data-slot="badge"]'))).toHaveLength(2);
    expect(screen.getByText("Ambiguous time zone")).toHaveClass("bg-yellow-100");
  });
});
