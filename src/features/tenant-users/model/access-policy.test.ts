import { describe, expect, it } from "vitest";
import { Authority } from "@/contexts/AuthContext";
import {
  canCreateTenantUser,
  canReadTenantUsers,
  canUpdateTenantUser,
  getCreatableTenantRoles,
  getEditableTenantRoles,
} from "./access-policy";
import { getTenantUserId, getTenantUuidForTenantScopedOps } from "./helpers";
import { TenantRole } from "./types";

describe("tenant users access policy", () => {
  it("derives creatable and editable tenant roles from authorities", () => {
    expect(getCreatableTenantRoles([Authority.TENANT_MANAGERS_CREATE, Authority.TENANT_USERS_CREATE])).toEqual([
      TenantRole.ROLE_TENANT_MANAGER,
      TenantRole.ROLE_TENANT_USER,
    ]);
    expect(getEditableTenantRoles([Authority.TENANT_USERS_UPDATE])).toEqual([TenantRole.ROLE_TENANT_USER]);
  });

  it("does not treat UI authorities as tenant-user CRUD access", () => {
    const authorities = [Authority.UI_TENANT_USERS_VIEW];

    expect(canReadTenantUsers(authorities)).toBe(false);
    expect(canCreateTenantUser(authorities, TenantRole.ROLE_TENANT_USER)).toBe(false);
    expect(canUpdateTenantUser(authorities, TenantRole.ROLE_TENANT_USER)).toBe(false);
  });

  it("checks update access by target tenant role", () => {
    expect(canUpdateTenantUser([Authority.TENANT_USERS_UPDATE], TenantRole.ROLE_TENANT_USER)).toBe(true);
    expect(canUpdateTenantUser([Authority.TENANT_USERS_UPDATE], TenantRole.ROLE_TENANT_MANAGER)).toBe(false);
  });

  it("uses explicit tenant and tenant-user identifiers for tenant-scoped APIs", () => {
    expect(getTenantUuidForTenantScopedOps({ uuid: "tenant-uuid-1" })).toBe("tenant-uuid-1");
    expect(getTenantUserId({ uuid: "user-uuid-1" })).toBe("user-uuid-1");
  });
});
