import { describe, expect, it } from "vitest";
import { bidToEditDraft, buildBidUpdateInput, hasBidUpdates, bidDraftErrors } from "./bid-edit";
import { makeBid } from "./bid-test-data";

describe("bid edit mapping", () => {
  it("creates an unchanged draft without producing a PATCH", () => {
    const bid = makeBid();
    const draft = bidToEditDraft(bid);

    const update = buildBidUpdateInput(bid, draft);

    expect(update).toEqual({ version: 7 });
    expect(hasBidUpdates(update)).toBe(false);
  });

  it("builds changed values and explicit clear instructions", () => {
    const bid = makeBid();
    const draft = {
      ...bidToEditDraft(bid),
      projectDescription: "Updated description",
      trades: "",
      rfiDeadlineAt: "",
      projectManager: null,
      autoUpdateEnabled: false,
    };

    const update = buildBidUpdateInput(bid, draft);

    expect(update).toMatchObject({
      version: 7,
      projectDescription: "Updated description",
      autoUpdateEnabled: false,
    });
    expect(update.clearFields).toEqual(expect.arrayContaining(["trades", "rfiDeadlineAt", "projectManagerUserUuid"]));
    expect(update).not.toHaveProperty("trades");
    expect(update).not.toHaveProperty("rfiDeadlineAt");
    expect(hasBidUpdates(update)).toBe(true);
  });

  it("normalizes country codes and comma-separated trades", () => {
    const bid = makeBid({ countryCode: null, trades: [] });
    const draft = {
      ...bidToEditDraft(bid),
      countryCode: "ca",
      trades: "Concrete, Electrical, Concrete",
    };

    expect(buildBidUpdateInput(bid, draft)).toMatchObject({
      countryCode: "CA",
      trades: ["Concrete", "Electrical"],
    });
  });
  it("clears every new optional field and replaces collections without losing zero", () => {
    const bid = makeBid({
      tags: [{ uuid: "tag-1", name: "Commercial" }],
      assignedUsers: [{ uuid: "user-1", displayName: "Alex", active: false }],
      division: "Interior",
      bidSubmittedDate: "2026-10-23",
      distanceMiles: { min: 60, max: 100 },
      opportunitySource: "BC",
      estimateValueCents: "129",
      relatedLinks: "Notes: https://example.com",
    });
    const draft = {
      ...bidToEditDraft(bid),
      tags: [],
      assignedUsers: [],
      projectManager: null,
      division: "",
      bidSubmittedDate: "",
      distanceMinMiles: "",
      distanceMaxMiles: "",
      opportunitySource: "" as const,
      estimateValue: "0",
      relatedLinks: "",
    };
    expect(bidDraftErrors(draft)).toEqual([]);
    const update = buildBidUpdateInput(bid, draft);
    expect(update).toMatchObject({ tagUuids: [], assignedUserUuids: [], estimateValueCents: "0" });
    expect(update.clearFields).toEqual(
      expect.arrayContaining([
        "projectManagerUserUuid",
        "division",
        "bidSubmittedDate",
        "distanceMiles",
        "opportunitySource",
        "relatedLinks",
      ])
    );
    expect(update.clearFields).not.toContain("estimateValueCents");
  });

  it("treats tag and assignee order as irrelevant", () => {
    const bid = makeBid({
      tags: [
        { uuid: "a", name: "A" },
        { uuid: "b", name: "B" },
      ],
    });
    const draft = { ...bidToEditDraft(bid), tags: [...bid.tags].reverse() };
    expect(buildBidUpdateInput(bid, draft)).toEqual({ version: bid.version });
  });
});
