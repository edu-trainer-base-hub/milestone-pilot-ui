import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { BidListTable } from "./BidListTable";
import { makeBid } from "../model/bid-test-data";

describe("Bid list columns", () => {
  beforeEach(() => localStorage.clear());
  it("shows new default columns and persists optional columns per user and tenant", async () => {
    const bid = makeBid({ division: "Interiors", estimateValueCents: "0" });
    const first = render(
      <MemoryRouter>
        <BidListTable bids={[bid]} loading={false} preferencesKey="user:tenant-a" />
      </MemoryRouter>
    );
    expect(screen.getByRole("columnheader", { name: "Tags" })).toBeInTheDocument();
    expect(screen.getByText("$0.00")).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Division" })).not.toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole("button", { name: "Columns" }), { key: "Enter" });
    fireEvent.click(await screen.findByRole("menuitemcheckbox", { name: "Division" }));
    fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });
    await waitFor(() => expect(screen.getByRole("columnheader", { name: "Division" })).toBeInTheDocument());
    expect(screen.getByText("Interiors")).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("user:tenant-a")!)).toContain("division");
    first.unmount();
    const restored = render(
      <MemoryRouter>
        <BidListTable bids={[bid]} loading={false} preferencesKey="user:tenant-a" />
      </MemoryRouter>
    );
    expect(screen.getByRole("columnheader", { name: "Division" })).toBeInTheDocument();
    restored.unmount();
    render(
      <MemoryRouter>
        <BidListTable bids={[bid]} loading={false} preferencesKey="user:tenant-b" />
      </MemoryRouter>
    );
    expect(screen.queryByRole("columnheader", { name: "Division" })).not.toBeInTheDocument();
  });
});
