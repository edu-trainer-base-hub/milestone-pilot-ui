import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { makeBid } from "../model/bid-test-data";
import { BidDetailsView } from "./BidDetailsView";

describe("BidDetailsView", () => {
  it("starts six cards collapsed with summaries and keeps the remaining details visible", () => {
    const bid = makeBid();
    render(<BidDetailsView bid={bid} />);

    const summaries = [
      ["Identifiers and source", bid.projectNumber!],
      ["Project location", bid.fullAddress!],
      ["Schedule and milestones", new Date(bid.bidDueAt!).toLocaleString()],
      ["Issuer and primary contact", bid.issuerCompanyName!],
      ["Submission", null],
      ["System record", null],
    ];
    summaries.forEach(([title, summary]) => {
      const trigger = screen.getByRole("button", { name: new RegExp(`^${title}`) });
      expect(trigger).toHaveAttribute("aria-expanded", "false");
      if (summary) expect(within(trigger).getByText(summary)).toBeInTheDocument();
      else expect(trigger).toHaveTextContent(new RegExp(`^${title}$`));
    });
    expect(screen.getAllByRole("button", { expanded: false })).toHaveLength(6);
    ["Central Library Expansion", "Coordinate with estimating.", "Morgan Stone", "Business details"].forEach((value) =>
      expect(screen.getByText(value)).toBeInTheDocument()
    );
    [
      "Solicitation number",
      "Address line 1",
      "RFI deadline",
      "Primary contact name",
      "Submission instructions",
      "Version",
    ].forEach((label) => expect(screen.queryByText(label)).not.toBeInTheDocument());
  });

  it("expands independently, hides duplicate summaries, and restores summaries on collapse", () => {
    const bid = makeBid();
    const { unmount } = render(<BidDetailsView bid={bid} />);
    const location = screen.getByRole("button", { name: /^Project location/ });
    const contact = screen.getByRole("button", { name: /^Issuer and primary contact/ });

    fireEvent.click(location);
    fireEvent.click(contact);
    expect(location).toHaveAttribute("aria-expanded", "true");
    expect(contact).toHaveAttribute("aria-expanded", "true");
    expect(within(location).queryByText(bid.fullAddress!)).not.toBeInTheDocument();
    expect(screen.getAllByText(bid.fullAddress!)).toHaveLength(1);
    expect(screen.getByText("Jordan Lee")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Submission/ })).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(location);
    expect(within(location).getByText(bid.fullAddress!)).toBeInTheDocument();
    expect(screen.queryByText("Address line 1")).not.toBeInTheDocument();
    expect(contact).toHaveAttribute("aria-expanded", "true");

    unmount();
    render(<BidDetailsView bid={bid} />);
    expect(screen.getAllByRole("button", { expanded: false })).toHaveLength(6);
  });

  it("uses dashes for missing summaries and refreshes summaries without resetting expansion", () => {
    const bid = makeBid({ fullAddress: null, projectNumber: "", bidDueAt: null, issuerCompanyName: null });
    const { rerender } = render(<BidDetailsView bid={bid} />);
    ["Identifiers and source", "Project location", "Schedule and milestones", "Issuer and primary contact"].forEach(
      (title) =>
        expect(within(screen.getByRole("button", { name: new RegExp(`^${title}`) })).getByText("—")).toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole("button", { name: /^Submission/ }));
    const updated = makeBid();
    rerender(<BidDetailsView bid={updated} />);
    expect(
      within(screen.getByRole("button", { name: /^Project location/ })).getByText(updated.fullAddress!)
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("button", { name: /^Identifiers and source/ })).getByText(updated.projectNumber!)
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("button", { name: /^Schedule and milestones/ })).getByText(
        new Date(updated.bidDueAt!).toLocaleString()
      )
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("button", { name: /^Issuer and primary contact/ })).getByText(updated.issuerCompanyName!)
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submission" })).toHaveAttribute("aria-expanded", "true");

    rerender(<BidDetailsView bid={{ ...updated, uuid: "another-bid" }} />);
    expect(screen.getAllByRole("button", { expanded: false })).toHaveLength(6);
  });

  it("renders every detail section and representative values after expanding", () => {
    render(<BidDetailsView bid={makeBid()} />);
    screen.getAllByRole("button", { expanded: false }).forEach((trigger) => fireEvent.click(trigger));

    [
      "Project and scope",
      "Identifiers and source",
      "Project location",
      "Schedule and milestones",
      "Issuer and primary contact",
      "Submission",
      "Ownership and controls",
      "System record",
    ].forEach((heading) => expect(screen.getByText(heading)).toBeInTheDocument());

    [
      "Central Library Expansion",
      "BP-07",
      "100 Main Street",
      "Jordan Lee",
      "Upload one signed PDF.",
      "Morgan Stone",
      "33333333-3333-3333-3333-333333333333",
    ].forEach((value) => expect(screen.getByText(value)).toBeInTheDocument());

    expect(screen.getByRole("link", { name: "jordan@example.com" })).toHaveAttribute(
      "href",
      "mailto:jordan@example.com"
    );
    expect(screen.getByRole("link", { name: "https://example.com/submit" })).toHaveAttribute(
      "href",
      "https://example.com/submit"
    );
    expect(screen.getByText("Email parse")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /timestamp warnings/ })).not.toBeInTheDocument();
  });

  it("opens uncertainty from the empty field's label and removes it after resolution", async () => {
    const normalization = {
      rawValue: "2026-09-01T15:00:00",
      sourceText: "Deadline: September 1 at 3pm",
      sourceTimezone: null,
      timezoneUsed: "America/Los_Angeles",
      resolvedValue: null,
      assumptions: ["TIMEZONE_FROM_TENANT"],
      unresolvedReasons: ["DST_OVERLAP"],
    };
    const bid = makeBid({
      bidDueAt: null,
      fieldAlerts: [
        {
          fieldName: "bidDueAt",
          updateRequestUuid: "review-time",
          changeUuid: "change-time",
          provisionallyApplied: false,
          timestampNormalization: normalization,
        },
      ],
    });
    const { rerender } = render(
      <MemoryRouter>
        <BidDetailsView bid={bid} />
      </MemoryRouter>
    );
    expect(screen.getAllByText("Timestamp warnings (1)").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: /^Schedule and milestones/ }));
    const trigger = screen.getByRole("button", { name: "Bid deadline: timestamp warnings" });
    expect(trigger).toHaveClass("bg-yellow-100");
    expect(within(trigger.closest("dt")!).getByText("Bid deadline")).toBeInTheDocument();
    expect(trigger.closest("dt")?.parentElement?.nextElementSibling).toHaveTextContent("—");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByText("Deadline: September 1 at 3pm")).not.toBeInTheDocument();
    fireEvent.click(trigger);
    const dialog = within(await screen.findByRole("dialog", { name: "Bid deadline: timestamp warnings" }));
    expect(dialog.getByRole("alert")).toHaveTextContent("Deadline: September 1 at 3pm");
    expect(dialog.getByRole("alert")).toHaveTextContent("America/Los_Angeles");
    expect(dialog.getByRole("alert")).toHaveTextContent(
      "This local time occurs twice because the clocks move back. Specify an offset."
    );
    expect(dialog.getByRole("link", { name: "Review this field" })).toHaveAttribute(
      "href",
      "/tenant/bid-update-requests?requestUuid=review-time"
    );
    rerender(
      <MemoryRouter>
        <BidDetailsView bid={{ ...bid, fieldAlerts: [] }} />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.queryByRole("button", { name: /timestamp warnings/ })).not.toBeInTheDocument();
  });

  it("uses one icon per field and shows only that field's alerts in its popup", async () => {
    const alert = {
      fieldName: "bidDueAt",
      updateRequestUuid: "deadline-review",
      changeUuid: "deadline-1",
      provisionallyApplied: true,
      timestampNormalization: {
        rawValue: "2026-09-01",
        sourceText: "Original deadline",
        sourceTimezone: null,
        timezoneUsed: "UTC",
        resolvedValue: "2026-09-01T00:00:00Z",
        assumptions: ["TIME_DEFAULTED_TO_MIDNIGHT"],
        unresolvedReasons: [],
      },
    };
    const bid = makeBid({
      fieldAlerts: [
        alert,
        {
          ...alert,
          changeUuid: "deadline-2",
          timestampNormalization: { ...alert.timestampNormalization, sourceText: "Updated deadline" },
        },
        {
          ...alert,
          fieldName: "rfiDeadlineAt",
          changeUuid: "rfi-1",
          updateRequestUuid: "rfi-review",
          timestampNormalization: { ...alert.timestampNormalization, sourceText: "RFI evidence" },
        },
        {
          ...alert,
          fieldName: "preBidMeetingAt",
          changeUuid: "meeting-1",
          timestampNormalization: { ...alert.timestampNormalization, sourceText: "Meeting evidence" },
        },
      ],
    });
    render(
      <MemoryRouter>
        <BidDetailsView bid={bid} />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole("button", { name: /^Schedule and milestones/ }));
    expect(screen.getAllByRole("button", { name: /timestamp warnings/ })).toHaveLength(3);
    expect(screen.getByRole("button", { name: "Pre-bid meeting: timestamp warnings" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "RFI deadline: timestamp warnings" }));
    let dialog = within(await screen.findByRole("dialog", { name: "RFI deadline: timestamp warnings" }));
    expect(dialog.getByText("RFI evidence")).toBeInTheDocument();
    expect(dialog.getAllByRole("alert")).toHaveLength(1);
    expect(dialog.queryByText("Original deadline")).not.toBeInTheDocument();
    expect(dialog.queryByText("Meeting evidence")).not.toBeInTheDocument();
    expect(dialog.getByRole("link", { name: "Review this field" })).toHaveAttribute(
      "href",
      "/tenant/bid-update-requests?requestUuid=rfi-review"
    );
    fireEvent.click(dialog.getByRole("button", { name: "Close alerts" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Bid deadline: timestamp warnings" }));
    dialog = within(await screen.findByRole("dialog", { name: "Bid deadline: timestamp warnings" }));
    expect(dialog.getAllByRole("alert")).toHaveLength(2);
    expect(dialog.getByText("Original deadline")).toBeInTheDocument();
    expect(dialog.getByText("Updated deadline")).toBeInTheDocument();
    expect(dialog.queryByText("RFI evidence")).not.toBeInTheDocument();
  });

  it("shows a dash for every missing value and falls back to an assignee UUID", () => {
    render(
      <BidDetailsView
        bid={makeBid({
          projectDescription: null,
          awardedAt: null,
          projectManager: { uuid: "unresolved-user", displayName: "unresolved-user", active: false },
        })}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /^Schedule and milestones/ }));
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("unresolved-user (Inactive)")).toBeInTheDocument();
  });
});
