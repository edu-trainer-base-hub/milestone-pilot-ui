import { describe, expect, it } from "vitest";
import { Authority } from "@/contexts/AuthContext";
import {
  canCreatePlatformUser,
  canReadPlatformTenants,
  canReadPlatformUsers,
  canReadTenantUsers,
  canUpdatePlatformUser,
  canUpdateTenantUser,
  getCreatablePlatformRoles,
  getCreatableTenantRoles,
  getEditableTenantRoles,
  hasAnyAuthority,
} from "./access-policy";
import {
  PlatformRole,
  TenantRole,
  getTenantIdForPlatformOps,
  getTenantUserId,
  getTenantUuidForTenantScopedOps,
} from "./types";

describe("authority access policy helpers", () => {
  it("matches authorities with hasAnyAuthority", () => {
    expect(hasAnyAuthority([Authority.UI_PLATFORM_USERS_VIEW], [Authority.UI_PLATFORM_USERS_VIEW])).toBe(true);
    expect(hasAnyAuthority([Authority.UI_PLATFORM_USERS_VIEW], [Authority.PLATFORM_MANAGERS_READ])).toBe(false);
  });

  it("derives creatable platform roles from target-role authorities", () => {
    expect(getCreatablePlatformRoles([Authority.PLATFORM_MANAGERS_CREATE])).toEqual([
      PlatformRole.ROLE_PLATFORM_MANAGER,
    ]);
    expect(getCreatablePlatformRoles([Authority.PLATFORM_ADMINS_CREATE, Authority.PLATFORM_MANAGERS_CREATE])).toEqual([
      PlatformRole.ROLE_PLATFORM_ADMIN,
      PlatformRole.ROLE_PLATFORM_MANAGER,
    ]);
  });

  it("derives creatable and editable tenant roles from authorities", () => {
    expect(getCreatableTenantRoles([Authority.TENANT_MANAGERS_CREATE, Authority.TENANT_USERS_CREATE])).toEqual([
      TenantRole.ROLE_TENANT_MANAGER,
      TenantRole.ROLE_TENANT_USER,
    ]);
    expect(getEditableTenantRoles([Authority.TENANT_USERS_UPDATE])).toEqual([TenantRole.ROLE_TENANT_USER]);
  });

  it("does not treat UI authorities as CRUD access", () => {
    const uiOnlyAuthorities = [Authority.UI_PLATFORM_USERS_VIEW, Authority.UI_TENANT_USERS_VIEW];

    expect(canReadPlatformTenants(uiOnlyAuthorities)).toBe(false);
    expect(canReadPlatformUsers(uiOnlyAuthorities)).toBe(false);
    expect(canReadTenantUsers(uiOnlyAuthorities)).toBe(false);
    expect(canCreatePlatformUser(uiOnlyAuthorities, PlatformRole.ROLE_PLATFORM_MANAGER)).toBe(false);
    expect(canUpdateTenantUser(uiOnlyAuthorities, TenantRole.ROLE_TENANT_USER)).toBe(false);
  });

  it("checks update access by target role instead of actor role strings", () => {
    expect(canUpdatePlatformUser([Authority.PLATFORM_MANAGERS_UPDATE], PlatformRole.ROLE_PLATFORM_MANAGER)).toBe(true);
    expect(canUpdatePlatformUser([Authority.PLATFORM_MANAGERS_UPDATE], PlatformRole.ROLE_PLATFORM_ADMIN)).toBe(false);
    expect(canUpdateTenantUser([Authority.TENANT_USERS_UPDATE], TenantRole.ROLE_TENANT_USER)).toBe(true);
    expect(canUpdateTenantUser([Authority.TENANT_USERS_UPDATE], TenantRole.ROLE_TENANT_MANAGER)).toBe(false);
  });

  it("uses explicit tenant and tenant-user identifiers for each API scope", () => {
    expect(getTenantIdForPlatformOps({ id: 12 })).toBe("12");
    expect(getTenantUuidForTenantScopedOps({ uuid: "tenant-uuid-1" })).toBe("tenant-uuid-1");
    expect(getTenantUserId({ uuid: "user-uuid-1" })).toBe("user-uuid-1");
  });
});
