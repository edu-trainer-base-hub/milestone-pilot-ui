import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { notifier } from "@/services/NotificationService";
import { BidParsingRunsPage } from "./BidParsingRunsPage";
import { getBidParsingRun, getBidParsingRuns, retryBidParsingRun } from "../api/bidParsing";
import type { BidEmailProcessingResult, BidParsingRun } from "../model/parsing-types";

vi.mock("../api/bidParsing");
vi.mock("@/services/NotificationService", () => ({ notifier: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/contexts/AuthContext", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/contexts/AuthContext")>()),
  useAuth: () => ({ principal: { authorities: ["TENANT_BIDS_PROCESS_EMAIL"] } }),
}));

const oldRun = run("run-old", "2026-07-28T10:00:00Z");
const newRun = run("run-new", "2026-07-28T11:00:00Z");

const renderPage = (search = "?runUuid=run-old") => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/tenant/bid-parsing-runs${search}`]}>
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
  it("highlights warnings and truncated input alongside successful parsing", async () => {
    vi.mocked(getBidParsingRun).mockResolvedValue({
      ...oldRun,
      warnings: ["Attachment text was incomplete"],
      inputTruncated: true,
    });
    renderPage();
    expect(await screen.findByRole("alert")).toHaveClass("bg-yellow-50");
    expect(screen.getByRole("alert")).toHaveTextContent("Attachment text was incomplete");
    expect(screen.getByText("Input truncated")).toHaveClass("bg-yellow-100");
    expect(screen.getAllByText("Completed").filter((element) => element.matches('[data-slot="badge"]'))).toHaveLength(
      3
    );
    screen
      .getAllByText("Completed")
      .filter((element) => element.matches('[data-slot="badge"]'))
      .forEach((badge) => expect(badge).toHaveClass("bg-green-50"));
  });
  it("filters history by content failures and displays the translated status", async () => {
    renderPage("?executionStatus=CONTENT_UNCLASSIFIABLE");
    await waitFor(() =>
      expect(getBidParsingRuns).toHaveBeenCalledWith(0, 20, {
        executionStatus: "CONTENT_UNCLASSIFIABLE",
        outcome: undefined,
        bidUuid: undefined,
      })
    );
    expect(screen.getByText("Content could not be analyzed")).toBeInTheDocument();
  });

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

  it.each(["CONTENT_UNCLASSIFIABLE", "PROVIDER_FAILED"])(
    "shows a failed %s retry without a success notification or review link",
    async (executionStatus) => {
      const failed = {
        ...newRun,
        executionStatus,
        parsingOutcome: "FAILED",
        bidIdentified: null,
        messageType: "UNCLASSIFIABLE",
        errorMessage: "The supplied content is unreadable.",
        normalizedResult: null,
      };
      vi.mocked(getBidParsingRun).mockImplementation((uuid) => Promise.resolve(uuid === newRun.uuid ? failed : oldRun));
      vi.mocked(retryBidParsingRun).mockResolvedValue({
        ...result(null),
        executionStatus,
        parsingOutcome: "FAILED",
        decision: "FAILED",
      });
      renderPage();
      fireEvent.click(await screen.findByRole("button", { name: "Retry with current configuration" }));
      expect(await screen.findByText("The supplied content is unreadable.")).toBeInTheDocument();
      expect(screen.getByRole("alert")).toHaveClass("text-destructive");
      expect(notifier.error).toHaveBeenCalledOnce();
      expect(notifier.success).not.toHaveBeenCalled();
      expect(screen.queryByRole("link", { name: "Review proposed changes" })).not.toBeInTheDocument();
      expect(screen.queryByText("The retry matched the bid with no field differences.")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Retry with current configuration" })).toBeEnabled();
    }
  );
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
