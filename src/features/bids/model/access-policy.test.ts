import { describe, expect, it } from "vitest";
import { Authority } from "@/contexts/AuthContext";
import { canCreateBids, canUpdateBids, canViewBidAudit, canViewBids } from "./access-policy";

describe("bid access policy", () => {
  it("requires both UI and read authorities to expose bid pages", () => {
    expect(canViewBids([Authority.UI_TENANT_BIDS_VIEW, Authority.TENANT_BIDS_READ])).toBe(true);
    expect(canViewBids([Authority.TENANT_BIDS_READ])).toBe(false);
  });

  it("uses action-specific authorities for mutations and audit", () => {
    const authorities = [Authority.TENANT_BIDS_CREATE, Authority.TENANT_BIDS_UPDATE, Authority.TENANT_BIDS_VIEW_AUDIT];
    expect(canCreateBids(authorities)).toBe(true);
    expect(canUpdateBids(authorities)).toBe(true);
    expect(canViewBidAudit(authorities)).toBe(true);
  });
});
