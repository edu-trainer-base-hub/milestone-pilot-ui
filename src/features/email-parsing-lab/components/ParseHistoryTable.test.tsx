import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ParseHistoryTable } from "./ParseHistoryTable";
import type { EmailParseResultPageResponse, EmailParseResultResponse } from "../model/types";
import { EmailParseSource, EmailParseStatus } from "../model/types";

const result = (uuid: string): EmailParseResultResponse => ({
  uuid,
  providerMessageId: "m1",
  subject: `Subject ${uuid}`,
  from: "alice@example.com",
  status: EmailParseStatus.COMPLETED,
  source: EmailParseSource.MANUAL,
  purpose: null,
  systemPrompt: null,
  expectedJsonSchema: null,
  aiProvider: null,
  aiModel: null,
  resultJson: null,
  resultText: null,
  errorMessage: null,
  attachmentsProcessed: null,
  attachmentsSkipped: null,
  requestedByUserUuid: null,
  createdAt: "2026-07-01T00:00:00Z",
  completedAt: null,
});

const pageOf = (
  results: EmailParseResultResponse[],
  page: number,
  totalElements: number
): EmailParseResultPageResponse => ({
  results,
  page,
  size: 10,
  totalElements,
});

const baseProps = {
  page: undefined as EmailParseResultPageResponse | undefined,
  loading: false,
  fetching: false,
  selectedResultUuid: null as string | null,
  onSelect: vi.fn(),
  onPageChange: vi.fn(),
};

describe("ParseHistoryTable", () => {
  it("renders skeleton rows during the initial load", () => {
    const { container } = render(<ParseHistoryTable {...baseProps} loading />);

    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
  });

  it("shows the range text and keeps the footer for a single page", () => {
    render(<ParseHistoryTable {...baseProps} page={pageOf([result("r1"), result("r2")], 0, 2)} />);

    expect(screen.getByText("Showing 1–2 of 2")).toBeInTheDocument();
    expect(screen.getByText("1 / 1")).toBeInTheDocument();
    expect(screen.getByLabelText("Previous page")).toBeDisabled();
    expect(screen.getByLabelText("Next page")).toBeDisabled();
  });

  it("computes the range for a middle page and navigates", () => {
    const onPageChange = vi.fn();
    const results = Array.from({ length: 10 }, (_, i) => result(`r${i}`));
    render(<ParseHistoryTable {...baseProps} page={pageOf(results, 1, 25)} onPageChange={onPageChange} />);

    expect(screen.getByText("Showing 11–20 of 25")).toBeInTheDocument();
    expect(screen.getByText("2 / 3")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Previous page"));
    expect(onPageChange).toHaveBeenCalledWith(0);
    fireEvent.click(screen.getByLabelText("Next page"));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("disables pagination while fetching and dims the body", () => {
    const { container } = render(<ParseHistoryTable {...baseProps} fetching page={pageOf([result("r1")], 0, 25)} />);

    expect(screen.getByLabelText("Previous page")).toBeDisabled();
    expect(screen.getByLabelText("Next page")).toBeDisabled();
    expect(container.querySelector("tbody")?.className).toContain("opacity-60");
  });

  it("notifies about a clicked row", () => {
    const onSelect = vi.fn();
    render(<ParseHistoryTable {...baseProps} page={pageOf([result("r1")], 0, 1)} onSelect={onSelect} />);

    fireEvent.click(screen.getByText("Subject r1"));

    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ uuid: "r1" }));
  });
});
