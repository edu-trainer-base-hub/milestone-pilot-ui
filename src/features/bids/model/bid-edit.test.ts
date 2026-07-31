import { describe, expect, it } from "vitest";
import { bidToEditDraft, buildBidUpdateInput, hasBidUpdates } from "./bid-edit";
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
      assignedToUserUuid: "",
      autoUpdateEnabled: false,
    };

    const update = buildBidUpdateInput(bid, draft);

    expect(update).toMatchObject({
      version: 7,
      projectDescription: "Updated description",
      autoUpdateEnabled: false,
    });
    expect(update.clearFields).toEqual(expect.arrayContaining(["trades", "rfiDeadlineAt", "assignedToUserUuid"]));
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
});
