import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { getBidSourceEmail, getBidSourceEmails } from "../api/bids";
import type { BidSourceEmail } from "../model/types";
import { BidEvidencePanel } from "./BidEvidencePanel";

vi.mock("../api/bids");

describe("BidEvidencePanel warnings", () => {
  it("distinguishes review, truncation, skipped attachments, and extraction failures", async () => {
    const actor = { type: "SYSTEM" as const, userUuid: null, displayName: null, email: null };
    const attachment = {
      uuid: "a-1",
      filename: "Plans.zip",
      mimeType: null,
      sizeBytes: null,
      extractionStatus: "UNSUPPORTED",
      extractedText: null,
      textTruncated: true,
      skipReason: "Unsupported archive",
      errorMessage: null,
    };
    const email: BidSourceEmail = {
      uuid: "email-1",
      connectorUuid: "connector-1",
      providerMessageId: "message-1",
      providerThreadId: null,
      sender: null,
      replyTo: null,
      subject: "Library invitation",
      sentAt: null,
      receivedAt: null,
      bodySha256: null,
      bodyContentTruncated: true,
      processingOutcome: "REVIEW_REQUESTED",
      createdBy: actor,
      attachments: [
        attachment,
        {
          ...attachment,
          uuid: "a-2",
          filename: "Broken.pdf",
          extractionStatus: "FAILED",
          textTruncated: false,
          skipReason: null,
          errorMessage: "Extraction failed",
        },
      ],
    };
    vi.mocked(getBidSourceEmails).mockResolvedValue({
      items: [{ ...email, attachmentCount: 2 }],
      page: 0,
      size: 20,
      totalElements: 1,
    });
    vi.mocked(getBidSourceEmail).mockResolvedValue(email);
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter initialEntries={["/?sourceEmailUuid=email-1"]}>
          <BidEvidencePanel bidUuid="bid-1" />
        </MemoryRouter>
      </QueryClientProvider>
    );
    await screen.findByText("Plans.zip");
    screen.getAllByText("REVIEW_REQUESTED").forEach((badge) => expect(badge).toHaveClass("bg-yellow-100"));
    expect(screen.getByText("Unsupported archive").closest('[role="alert"]')).toHaveClass("bg-yellow-50");
    expect(
      screen.getByText("Extraction failed", { selector: '[data-slot="alert-description"]' }).closest('[role="alert"]')
    ).toHaveClass("text-destructive");
    expect(screen.getAllByText("Input truncated")).toHaveLength(3);
  });
});
