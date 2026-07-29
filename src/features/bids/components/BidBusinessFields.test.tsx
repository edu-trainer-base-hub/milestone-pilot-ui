import { useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createBidTag, searchBidTags, searchBidUsers } from "../api/bids";
import { bidToEditDraft, buildBidCreateInput } from "../model/bid-edit";
import { BidEditForm } from "./BidEditForm";

vi.mock("../api/bids");
vi.mock("@/contexts/AuthContext", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/contexts/AuthContext")>()),
  useAuth: () => ({ principal: { id: "user", activeTenantUuid: "tenant", authorities: ["TENANT_BIDS_CREATE"] } }),
}));

const user = { uuid: "user-1", displayName: "Alex Builder", active: true };
const tag = { uuid: "tag-1", name: "Commercial" };
const submit = vi.fn();
function Form() {
  const [draft, setDraft] = useState(() => bidToEditDraft({}));
  return (
    <>
      <BidEditForm creating draft={draft} onChange={setDraft} onSubmit={() => submit(buildBidCreateInput(draft))} />
      <button type="submit" form="bid-edit-form">
        Create test bid
      </button>
    </>
  );
}
function renderForm() {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <Form />
    </QueryClientProvider>
  );
}

describe("Bid business fields", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(searchBidTags).mockImplementation(async (search) => ({
      items: search ? [] : [tag],
      page: 0,
      size: 50,
      totalElements: search ? 0 : 1,
    }));
    vi.mocked(searchBidUsers).mockResolvedValue({ items: [user], page: 0, size: 50, totalElements: 1 });
    vi.mocked(createBidTag).mockResolvedValue({ uuid: "tag-2", name: "Public" });
  });

  it("searches and creates tags, selects independent user roles, and submits new values", async () => {
    renderForm();
    fireEvent.change(screen.getByLabelText("Project"), { target: { value: "Library" } });
    fireEvent.click(screen.getByRole("combobox", { name: "Tags" }));
    fireEvent.click(await screen.findByRole("option", { name: "Commercial" }));
    fireEvent.change(screen.getByRole("combobox", { name: "Search Tags" }), { target: { value: "Public" } });
    await waitFor(() => expect(searchBidTags).toHaveBeenCalledWith("Public", 0));
    fireEvent.click(screen.getByRole("option", { name: "Create “Public”" }));
    await screen.findByRole("button", { name: "Remove Public" });
    await waitFor(() => expect(screen.getByRole("combobox", { name: "Tags" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Remove Commercial" }));
    fireEvent.click(screen.getByRole("combobox", { name: "Tags" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    for (const label of ["Project manager", "Estimator", "Assigned users"]) {
      fireEvent.click(screen.getByRole("combobox", { name: label }));
      fireEvent.click(await screen.findByRole("option", { name: "Alex Builder" }));
      if (label === "Assigned users") fireEvent.click(screen.getByRole("combobox", { name: label }));
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    }
    fireEvent.change(screen.getByLabelText("Bid submitted date"), { target: { value: "2026-10-23" } });
    fireEvent.change(screen.getByLabelText("Minimum miles"), { target: { value: "60" } });
    fireEvent.change(screen.getByLabelText("Maximum miles"), { target: { value: "100" } });
    fireEvent.change(screen.getByLabelText("Estimate value (USD)"), { target: { value: "1234,56" } });
    fireEvent.change(screen.getByLabelText("Related links"), {
      target: { value: "Plans: https://example.com\nScope notes" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create test bid" }));
    expect(submit).toHaveBeenCalledWith(
      expect.objectContaining({
        projectName: "Library",
        tagUuids: ["tag-2"],
        projectManagerUserUuid: "user-1",
        estimatorUserUuid: "user-1",
        assignedUserUuids: ["user-1"],
        bidSubmittedDate: "2026-10-23",
        distanceMiles: { min: 60, max: 100 },
        estimateValueCents: "123456",
        relatedLinks: "Plans: https://example.com\nScope notes",
      })
    );
    expect(createBidTag).toHaveBeenCalledWith("Public");
  }, 10000);

  it("blocks invalid bounds and money on submit, while accepting a minimal form", () => {
    renderForm();
    fireEvent.change(screen.getByLabelText("Project"), { target: { value: "Library" } });
    fireEvent.change(screen.getByLabelText("Minimum miles"), { target: { value: "100" } });
    fireEvent.click(screen.getByRole("button", { name: "Create test bid" }));
    expect(submit).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Enter both miles bounds");
    fireEvent.change(screen.getByLabelText("Minimum miles"), { target: { value: "" } });
    fireEvent.change(screen.getByLabelText("Estimate value (USD)"), { target: { value: "1.001" } });
    fireEvent.click(screen.getByRole("button", { name: "Create test bid" }));
    expect(submit).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("Estimate value (USD)"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Create test bid" }));
    expect(submit).toHaveBeenCalledWith(
      expect.objectContaining({ projectName: "Library", tagUuids: [], assignedUserUuids: [] })
    );
  });
});
