import { describe, expect, it } from "vitest";
import { TenantRole, canManageTenantUser, getAssignableTenantRoles, getTenantRoleOptions } from "./types";

describe("tenant role policy helpers", () => {
  it("returns backend-aligned assignable roles for tenant admins", () => {
    expect(getAssignableTenantRoles(TenantRole.ROLE_TENANT_ADMIN)).toEqual([
      TenantRole.ROLE_TENANT_MANAGER,
      TenantRole.ROLE_TENANT_USER,
    ]);
  });

  it("returns backend-aligned assignable roles for tenant managers", () => {
    expect(getAssignableTenantRoles(TenantRole.ROLE_TENANT_MANAGER)).toEqual([TenantRole.ROLE_TENANT_USER]);
  });

  it("returns no assignable roles for tenant users or missing roles", () => {
    expect(getAssignableTenantRoles(TenantRole.ROLE_TENANT_USER)).toEqual([]);
    expect(getAssignableTenantRoles(null)).toEqual([]);
  });

  it("exposes user-facing role options only for assignable tenant roles", () => {
    expect(getTenantRoleOptions(TenantRole.ROLE_TENANT_ADMIN)).toEqual([
      { value: TenantRole.ROLE_TENANT_MANAGER, label: "TENANT MANAGER" },
      { value: TenantRole.ROLE_TENANT_USER, label: "TENANT USER" },
    ]);
  });

  it("applies editable target-role rules for tenant-level management", () => {
    expect(canManageTenantUser(TenantRole.ROLE_TENANT_ADMIN, TenantRole.ROLE_TENANT_ADMIN)).toBe(false);
    expect(canManageTenantUser(TenantRole.ROLE_TENANT_ADMIN, TenantRole.ROLE_TENANT_MANAGER)).toBe(true);
    expect(canManageTenantUser(TenantRole.ROLE_TENANT_ADMIN, TenantRole.ROLE_TENANT_USER)).toBe(true);
    expect(canManageTenantUser(TenantRole.ROLE_TENANT_MANAGER, TenantRole.ROLE_TENANT_MANAGER)).toBe(false);
    expect(canManageTenantUser(TenantRole.ROLE_TENANT_MANAGER, TenantRole.ROLE_TENANT_USER)).toBe(true);
    expect(canManageTenantUser(TenantRole.ROLE_TENANT_USER, TenantRole.ROLE_TENANT_USER)).toBe(false);
  });
});
