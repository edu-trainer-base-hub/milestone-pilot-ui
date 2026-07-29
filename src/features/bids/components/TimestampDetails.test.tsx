import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TimestampDetails } from "./TimestampDetails";

describe("TimestampDetails", () => {
  it("keeps evidence after resolution without continuing to show an active warning", () => {
    const normalization = {
      rawValue: "2026-09-01",
      sourceText: "Due September 1",
      sourceTimezone: null,
      timezoneUsed: "America/Los_Angeles",
      resolvedValue: "2026-09-01T07:00:00Z",
      assumptions: ["TIME_DEFAULTED_TO_MIDNIGHT", "TIMEZONE_FROM_TENANT"],
      unresolvedReasons: [],
    };
    const { rerender } = render(<TimestampDetails normalization={normalization} provisionallyApplied />);
    expect(screen.getByRole("alert")).toHaveTextContent("Timestamp needs review");
    expect(screen.getByRole("alert")).toHaveClass("bg-yellow-50");
    expect(screen.getByRole("alert").querySelector("svg")).toHaveClass("lucide-triangle-alert");
    rerender(<TimestampDetails normalization={normalization} provisionallyApplied inactive />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("note")).toHaveTextContent("Due September 1");
    expect(screen.getByRole("note")).not.toHaveClass("bg-yellow-50");
    expect(screen.getByRole("note").querySelector("svg")).toHaveClass("lucide-info");
    expect(screen.queryByText("This value was filled using defaults and needs confirmation.")).not.toBeInTheDocument();
  });
});
