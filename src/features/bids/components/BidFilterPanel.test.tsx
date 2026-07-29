import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSelectedBidTags, getSelectedBidUsers } from "../api/bids";
import { BidFilterPanel } from "./BidFilterPanel";
import { bidFiltersFromParams } from "../model/bid-filters";

vi.mock("../api/bids");
vi.mock("@/contexts/AuthContext", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/contexts/AuthContext")>()),
  useAuth: () => ({ principal: { activeTenantUuid: "tenant-1" } }),
}));

function panel(query: string) {
  const onApply = vi.fn();
  render(
    <QueryClientProvider client={new QueryClient()}>
      <BidFilterPanel params={new URLSearchParams(query)} onApply={onApply} />
    </QueryClientProvider>
  );
  fireEvent.click(screen.getByRole("button", { name: "More filters" }));
  return onApply;
}

describe("Bid filters", () => {
  beforeEach(() => {
    vi.mocked(getSelectedBidTags).mockResolvedValue({
      items: [
        { uuid: "tag-1", name: "Commercial" },
        { uuid: "tag-2", name: "Public" },
      ],
      page: 0,
      size: 100,
      totalElements: 2,
    });
    vi.mocked(getSelectedBidUsers).mockResolvedValue({ items: [], page: 0, size: 100, totalElements: 0 });
  });
  it("restores URL values and applies normalized ranges without losing search or sort", async () => {
    const onApply = panel(
      "search=Library&sort=estimateValueCents&page=4&tagUuids=tag-1,tag-2&tagMatch=ALL&opportunitySources=BC&division=Interiors&estimateMinCents=29&distanceFromMiles=60"
    );
    expect(await screen.findByRole("button", { name: "Remove Commercial" })).toBeInTheDocument();
    expect(screen.getByLabelText("Division")).toHaveValue("Interiors");
    expect(screen.getByLabelText("Minimum estimate (USD)")).toHaveValue("0.29");
    expect(screen.getByRole("checkbox", { name: "BC" })).toBeChecked();
    fireEvent.change(screen.getByLabelText("Maximum estimate (USD)"), { target: { value: "1,234.56" } });
    fireEvent.change(screen.getByLabelText("Distance through (miles)"), { target: { value: "100" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
    const params: URLSearchParams = onApply.mock.calls[0][0];
    expect(params.get("page")).toBe("0");
    expect(params.get("search")).toBe("Library");
    expect(params.get("sort")).toBe("estimateValueCents");
    expect(bidFiltersFromParams(params)).toMatchObject({
      tagUuids: ["tag-1", "tag-2"],
      tagMatch: "ALL",
      opportunitySources: ["BC"],
      division: "Interiors",
      estimateMinCents: "29",
      estimateMaxCents: "123456",
      distanceFromMiles: 60,
      distanceToMiles: 100,
    });
  });

  it("rejects reversed ranges before requesting a filtered page", () => {
    const onApply = panel("estimateMinCents=200&estimateMaxCents=100");
    fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Range minimum must not exceed maximum");
    expect(onApply).not.toHaveBeenCalled();
  });
});
