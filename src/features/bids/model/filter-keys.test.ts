import { describe, expect, it } from "vitest";
import { countActiveFilters } from "./filter-keys";

describe("countActiveFilters", () => {
  it("counts only advanced filter params, ignoring search, sort, status and tagMatch", () => {
    const params = new URLSearchParams("search=a&sort=status&status=OPEN&tagUuids=t1&tagMatch=ALL&division=X&page=2");
    expect(countActiveFilters(params)).toBe(2);
  });
  it("is zero without advanced filters", () => {
    expect(countActiveFilters(new URLSearchParams("page=1"))).toBe(0);
  });
});
