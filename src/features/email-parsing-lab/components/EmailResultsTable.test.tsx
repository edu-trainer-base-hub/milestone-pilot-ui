import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { EmailResultsTable } from "./EmailResultsTable";
import type { EmailMessageResponse } from "../model/types";

const message = (id: string): EmailMessageResponse => ({
  providerMessageId: id,
  threadId: "t1",
  historyId: "h1",
  internalDate: 1700000000000,
  labelIds: null,
  from: "alice@example.com",
  to: null,
  cc: null,
  subject: `Subject ${id}`,
  dateHeader: null,
  snippet: "snippet",
  contentType: null,
  content: null,
  contentTruncated: false,
  attachments: null,
});

const baseProps = {
  messages: [] as EmailMessageResponse[],
  loading: false,
  hasSearched: false,
  pageIndex: 0,
  resultSizeEstimate: null as number | null,
  hasPrevPage: false,
  hasNextPage: false,
  onPrevPage: vi.fn(),
  onNextPage: vi.fn(),
  selectedMessageId: null as string | null,
  onSelect: vi.fn(),
};

describe("EmailResultsTable", () => {
  it("shows a hint before the first search and hides the footer", () => {
    render(<EmailResultsTable {...baseProps} />);

    expect(screen.getByText("Run a search to load emails.")).toBeInTheDocument();
    expect(screen.queryByLabelText("Next page")).not.toBeInTheDocument();
  });

  it("shows the no-results empty state after a search", () => {
    render(<EmailResultsTable {...baseProps} hasSearched />);

    expect(screen.getByText("No emails found. Adjust the filters and search again.")).toBeInTheDocument();
  });

  it("renders skeleton rows while loading", () => {
    const { container } = render(<EmailResultsTable {...baseProps} loading />);

    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
    expect(screen.queryByText("Run a search to load emails.")).not.toBeInTheDocument();
  });

  it("shows loaded count, estimated total and page label in the footer", () => {
    render(
      <EmailResultsTable
        {...baseProps}
        hasSearched
        messages={[message("m1"), message("m2")]}
        pageIndex={1}
        resultSizeEstimate={42}
        hasPrevPage
        hasNextPage
      />
    );

    expect(screen.getByText(/2 emails loaded/)).toBeInTheDocument();
    expect(screen.getByText(/~42 total \(estimate\)/)).toBeInTheDocument();
    expect(screen.getByText("Page 2")).toBeInTheDocument();
  });

  it("wires prev/next buttons and disables them at the walk boundaries", () => {
    const onPrevPage = vi.fn();
    const onNextPage = vi.fn();
    const { rerender } = render(
      <EmailResultsTable
        {...baseProps}
        hasSearched
        messages={[message("m1")]}
        hasPrevPage
        hasNextPage
        onPrevPage={onPrevPage}
        onNextPage={onNextPage}
      />
    );

    fireEvent.click(screen.getByLabelText("Previous page"));
    fireEvent.click(screen.getByLabelText("Next page"));
    expect(onPrevPage).toHaveBeenCalledTimes(1);
    expect(onNextPage).toHaveBeenCalledTimes(1);

    rerender(
      <EmailResultsTable
        {...baseProps}
        hasSearched
        messages={[message("m1")]}
        hasPrevPage={false}
        hasNextPage={false}
        onPrevPage={onPrevPage}
        onNextPage={onNextPage}
      />
    );
    expect(screen.getByLabelText("Previous page")).toBeDisabled();
    expect(screen.getByLabelText("Next page")).toBeDisabled();
  });

  it("notifies about a clicked row", () => {
    const onSelect = vi.fn();
    render(<EmailResultsTable {...baseProps} hasSearched messages={[message("m1")]} onSelect={onSelect} />);

    fireEvent.click(screen.getByText("Subject m1"));

    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ providerMessageId: "m1" }));
  });
});
