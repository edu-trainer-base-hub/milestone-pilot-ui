import { describe, expect, it } from "vitest";
import { Authority } from "@/contexts/AuthContext";
import { canCreatePlatformTenants, canReadPlatformTenants, canUpdatePlatformTenants } from "./access-policy";
import { getTenantIdForPlatformOps } from "./helpers";

describe("tenant management access policy", () => {
  it("checks platform tenant CRUD authorities", () => {
    expect(canReadPlatformTenants([Authority.PLATFORM_TENANTS_READ])).toBe(true);
    expect(canCreatePlatformTenants([Authority.PLATFORM_TENANTS_CREATE])).toBe(true);
    expect(canUpdatePlatformTenants([Authority.PLATFORM_TENANTS_UPDATE])).toBe(true);
  });

  it("does not treat UI authorities as tenant CRUD access", () => {
    expect(canReadPlatformTenants([Authority.UI_PLATFORM_TENANTS_VIEW])).toBe(false);
    expect(canCreatePlatformTenants([Authority.UI_PLATFORM_TENANTS_VIEW])).toBe(false);
    expect(canUpdatePlatformTenants([Authority.UI_PLATFORM_TENANTS_VIEW])).toBe(false);
  });

  it("uses the platform tenant identifier helper for tenant CRUD APIs", () => {
    expect(getTenantIdForPlatformOps({ id: 12 })).toBe("12");
  });
});
