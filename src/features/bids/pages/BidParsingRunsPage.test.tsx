import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { BidParsingRunsPage } from "./BidParsingRunsPage";
import { getBidParsingRun, getBidParsingRuns, retryBidParsingRun } from "../api/bidParsing";
import type { BidEmailProcessingResult, BidParsingRun } from "../model/parsing-types";

vi.mock("../api/bidParsing");
vi.mock("@/contexts/AuthContext", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/contexts/AuthContext")>()),
  useAuth: () => ({ principal: { authorities: ["TENANT_BIDS_PROCESS_EMAIL"] } }),
}));

const oldRun = run("run-old", "2026-07-28T10:00:00Z");
const newRun = run("run-new", "2026-07-28T11:00:00Z");

const renderPage = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/tenant/bid-parsing-runs?runUuid=run-old"]}>
        <BidParsingRunsPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getBidParsingRuns).mockResolvedValue({
    items: [newRun, oldRun],
    page: 0,
    size: 20,
    totalElements: 2,
  });
  vi.mocked(getBidParsingRun).mockImplementation((uuid) => Promise.resolve(uuid === newRun.uuid ? newRun : oldRun));
});

describe("BidParsingRunsPage", () => {
  it("selects and refreshes the new retry run and links to its review request", async () => {
    vi.mocked(retryBidParsingRun).mockResolvedValue(result("request-1"));
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Retry with current configuration" }));

    expect(await screen.findByText("The retry found differences and created a review request.")).toBeInTheDocument();
    const reviewLink = screen.getByRole("link", { name: "Review proposed changes" });
    expect(reviewLink).toHaveAttribute("href", "/tenant/bid-update-requests?requestUuid=request-1");
    await waitFor(() => expect(getBidParsingRun).toHaveBeenCalledWith("run-new"));
    expect(screen.getByText(/"projectName": "Retried project"/)).toBeInTheDocument();
  });

  it("distinguishes a successful retry with no field differences", async () => {
    vi.mocked(retryBidParsingRun).mockResolvedValue(result(null));
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Retry with current configuration" }));

    expect(await screen.findByText("The retry matched the bid with no field differences.")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Review proposed changes" })).not.toBeInTheDocument();
  });
});

function run(uuid: string, createdAt: string): BidParsingRun {
  return {
    uuid,
    sourceEmailUuid: "source-1",
    retryOfRunUuid: uuid === "run-new" ? "run-old" : null,
    executionStatus: "COMPLETED",
    parsingOutcome: "BID_IDENTIFIED",
    messageType: "INITIAL_INVITATION",
    bidIdentified: true,
    promptVersion: "1",
    schemaVersion: "1",
    aiProvider: "OPENAI",
    aiModel: "model",
    normalizedResult: { projectName: uuid === "run-new" ? "Retried project" : "Original project" },
    warnings: [],
    errorCode: null,
    errorMessage: null,
    attachmentsProcessed: 0,
    attachmentsSkipped: 0,
    inputTruncated: false,
    durationMs: 100,
    createdAt,
    completedAt: createdAt,
    requestedBy: {
      type: "USER",
      userUuid: "user-1",
      displayName: "Taylor Manager",
      email: "taylor@example.com",
    },
  };
}

function result(updateRequestUuid: string | null): BidEmailProcessingResult {
  return {
    sourceEmailUuid: "source-1",
    parsingRunUuid: "run-new",
    executionStatus: "COMPLETED",
    parsingOutcome: "BID_IDENTIFIED",
    decision: updateRequestUuid ? "REVIEW_REQUESTED" : "EXACT_MATCH",
    bidUuid: "bid-1",
    updateRequestUuid,
    duplicate: false,
    warnings: [],
  };
}
