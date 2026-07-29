import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BidSummaryStrip } from "./BidSummaryStrip";

const summary = {
  open: 12,
  dueSoon: 4,
  overdue: 2,
  pendingReview: 5,
  submitted: 8,
  awarded: 3,
  recentParsingFailures: 0,
};

describe("BidSummaryStrip", () => {
  it("renders every count and flags overdue only when above zero", () => {
    render(<BidSummaryStrip summary={summary} />);
    expect(screen.getByTestId("bid-summary-open")).toHaveTextContent("12");
    expect(screen.getByTestId("bid-summary-overdue")).toHaveAttribute("data-alert", "true");
    expect(screen.getByTestId("bid-summary-parsingFailures")).not.toHaveAttribute("data-alert");
  });
  it("shows no counts while loading", () => {
    render(<BidSummaryStrip />);
    expect(screen.queryByTestId("bid-summary-open")).not.toBeInTheDocument();
  });
});
