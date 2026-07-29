import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import type { BidFieldAlert } from "../model/timestamp-types";
import type { BidReviewStatus } from "../model/types";
import { BidReviewBadges } from "./BidReviewBadges";

const timestampAlert: BidFieldAlert = {
  fieldName: "bidDueAt",
  updateRequestUuid: "review-1",
  changeUuid: "change-1",
  provisionallyApplied: true,
  timestampNormalization: {
    rawValue: "2026-09-01",
    sourceText: "Due September 1",
    sourceTimezone: "America/Los_Angeles",
    timezoneUsed: "America/Los_Angeles",
    resolvedValue: "2026-09-01T07:00:00Z",
    assumptions: ["TIME_DEFAULTED_TO_MIDNIGHT"],
    unresolvedReasons: ["DST_OVERLAP"],
  },
};

describe("BidReviewBadges", () => {
  it.each<[boolean, BidReviewStatus, string]>([
    [false, "NONE", "None"],
    [true, "NONE", "Review required"],
    [false, "REVIEW_REQUIRED", "Review required"],
    [true, "REVIEW_REQUIRED", "Review required"],
    [false, "IN_REVIEW", "In review"],
    [true, "IN_REVIEW", "In review"],
  ])("combines requiresReview=%s and status=%s into one badge", (requiresReview, reviewStatus, label) => {
    const { container } = render(<BidReviewBadges bid={{ requiresReview, reviewStatus }} />);
    expect(screen.getByText(label)).toBeInTheDocument();
    expect(container.querySelectorAll('[data-slot="badge"]')).toHaveLength(1);
    expect(screen.getByText(label)).toHaveClass(
      label === "Review required" ? "bg-yellow-100" : label === "In review" ? "bg-blue-50" : "text-foreground"
    );
  });

  it.each<[boolean, BidReviewStatus, string | null]>([
    [true, "REVIEW_REQUIRED", "Review required"],
    [true, "IN_REVIEW", "In review"],
    [false, "NONE", null],
  ])("keeps compact review state %s/%s beside one warning icon", (requiresReview, reviewStatus, label) => {
    const { container } = render(
      <BidReviewBadges bid={{ requiresReview, reviewStatus, fieldAlerts: [timestampAlert] }} compact />
    );
    expect(screen.getByRole("button", { name: "Timestamp warnings (1)" })).toHaveClass("bg-yellow-100");
    expect(screen.queryByText("Timestamp warnings (1)")).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText("Due September 1")).not.toBeInTheDocument();
    if (label) expect(screen.getByText(label)).toBeInTheDocument();
    expect(container.querySelectorAll('[data-slot="badge"]')).toHaveLength(label ? 1 : 0);
    expect(screen.queryByText("None")).not.toBeInTheDocument();
  });

  it("omits the compact icon when there are no field alerts", () => {
    render(<BidReviewBadges bid={{ requiresReview: false, reviewStatus: "NONE" }} compact />);
    expect(screen.getByText("None")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("groups all details by field and restores trigger focus after Escape or close", async () => {
    render(
      <MemoryRouter>
        <BidReviewBadges
          compact
          bid={{
            requiresReview: true,
            reviewStatus: "REVIEW_REQUIRED",
            fieldAlerts: [
              timestampAlert,
              {
                ...timestampAlert,
                changeUuid: "change-2",
                timestampNormalization: { ...timestampAlert.timestampNormalization, sourceText: "Updated deadline" },
              },
              {
                ...timestampAlert,
                fieldName: "rfiDeadlineAt",
                changeUuid: "change-3",
                updateRequestUuid: "review-2",
                timestampNormalization: { ...timestampAlert.timestampNormalization, sourceText: "RFI due September 1" },
              },
            ],
          }}
        />
      </MemoryRouter>
    );
    const trigger = screen.getByRole("button", { name: "Timestamp warnings (2)" });
    trigger.focus();
    fireEvent.click(trigger);
    const dialog = within(await screen.findByRole("dialog", { name: "Timestamp warnings (2)" }));
    expect(dialog.getByRole("heading", { name: "Bid deadline" })).toBeInTheDocument();
    expect(dialog.getByRole("heading", { name: "RFI deadline" })).toBeInTheDocument();
    expect(dialog.getAllByRole("alert")).toHaveLength(3);
    ["Due September 1", "Updated deadline", "RFI due September 1"].forEach((text) =>
      expect(dialog.getByText(text)).toBeInTheDocument()
    );
    expect(dialog.getAllByText("2026-09-01")).toHaveLength(3);
    expect(dialog.getAllByText("2026-09-01T07:00:00Z")).toHaveLength(3);
    expect(dialog.getAllByText("America/Los_Angeles")).toHaveLength(6);
    expect(dialog.getAllByText("This value was filled using defaults and needs confirmation.")).toHaveLength(3);
    expect(dialog.getAllByText("The time was missing. Midnight (00:00) was assumed.")).toHaveLength(3);
    expect(dialog.getAllByRole("link", { name: "Review this field" })[2]).toHaveAttribute(
      "href",
      "/tenant/bid-update-requests?requestUuid=review-2"
    );
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
    fireEvent.click(trigger);
    fireEvent.click(await screen.findByRole("button", { name: "Close alerts" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("counts distinct affected fields and removes warnings when refreshed alerts are empty", () => {
    const alert: BidFieldAlert = {
      fieldName: "bidDueAt",
      updateRequestUuid: "review-1",
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
    };
    const bid = {
      requiresReview: false,
      reviewStatus: "NONE" as const,
      fieldAlerts: [alert, { ...alert, changeUuid: "change-2" }, { ...alert, fieldName: "rfiDeadlineAt" }],
    };
    const { rerender } = render(<BidReviewBadges bid={bid} />);
    expect(screen.getByText("Timestamp warnings (2)")).toHaveClass("bg-yellow-100");
    expect(screen.queryByText("None")).not.toBeInTheDocument();
    rerender(<BidReviewBadges bid={{ ...bid, fieldAlerts: [] }} />);
    expect(screen.queryByText(/Timestamp warnings/)).not.toBeInTheDocument();
    expect(screen.getByText("None")).toBeInTheDocument();
  });
});
