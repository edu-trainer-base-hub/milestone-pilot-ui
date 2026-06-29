import { Authority, type Authority as AuthorityValue } from "@/contexts/AuthContext";
import { PlatformRole, TenantRole } from "./types";

type ManagedRole = PlatformRole | TenantRole;
type CrudAction = "create" | "read" | "update";

const ROLE_AUTHORITY_MATRIX: Record<ManagedRole, Record<CrudAction, AuthorityValue>> = {
  [PlatformRole.ROLE_PLATFORM_ADMIN]: {
    create: Authority.PLATFORM_ADMINS_CREATE,
    read: Authority.PLATFORM_ADMINS_READ,
    update: Authority.PLATFORM_ADMINS_UPDATE,
  },
  [PlatformRole.ROLE_PLATFORM_MANAGER]: {
    create: Authority.PLATFORM_MANAGERS_CREATE,
    read: Authority.PLATFORM_MANAGERS_READ,
    update: Authority.PLATFORM_MANAGERS_UPDATE,
  },
  [TenantRole.ROLE_TENANT_ADMIN]: {
    create: Authority.TENANT_ADMINS_CREATE,
    read: Authority.TENANT_ADMINS_READ,
    update: Authority.TENANT_ADMINS_UPDATE,
  },
  [TenantRole.ROLE_TENANT_MANAGER]: {
    create: Authority.TENANT_MANAGERS_CREATE,
    read: Authority.TENANT_MANAGERS_READ,
    update: Authority.TENANT_MANAGERS_UPDATE,
  },
  [TenantRole.ROLE_TENANT_USER]: {
    create: Authority.TENANT_USERS_CREATE,
    read: Authority.TENANT_USERS_READ,
    update: Authority.TENANT_USERS_UPDATE,
  },
};

const PLATFORM_ROLES = [PlatformRole.ROLE_PLATFORM_ADMIN, PlatformRole.ROLE_PLATFORM_MANAGER] as const;
const TENANT_ROLES = [
  TenantRole.ROLE_TENANT_ADMIN,
  TenantRole.ROLE_TENANT_MANAGER,
  TenantRole.ROLE_TENANT_USER,
] as const;

const normalizeAuthorities = (authorities?: readonly AuthorityValue[] | null): readonly AuthorityValue[] =>
  authorities ?? [];

export const hasAnyAuthority = (
  authorities?: readonly AuthorityValue[] | null,
  required?: readonly AuthorityValue[] | null
): boolean => {
  if (!required?.length) {
    return false;
  }

  const authoritySet = new Set(normalizeAuthorities(authorities));
  return required.some((authority) => authoritySet.has(authority));
};

const canManageRole = (
  authorities: readonly AuthorityValue[] | null | undefined,
  targetRole: string | null | undefined,
  action: CrudAction
): boolean => {
  if (!targetRole) {
    return false;
  }

  const matchingAuthority = ROLE_AUTHORITY_MATRIX[targetRole as ManagedRole]?.[action];
  return matchingAuthority ? hasAnyAuthority(authorities, [matchingAuthority]) : false;
};

const getManageableRoles = <TRole extends ManagedRole>(
  authorities: readonly AuthorityValue[] | null | undefined,
  roles: readonly TRole[],
  action: CrudAction
): TRole[] => roles.filter((role) => canManageRole(authorities, role, action));

export const canReadPlatformTenants = (authorities?: readonly AuthorityValue[] | null): boolean =>
  hasAnyAuthority(authorities, [Authority.PLATFORM_TENANTS_READ]);

export const canCreatePlatformTenants = (authorities?: readonly AuthorityValue[] | null): boolean =>
  hasAnyAuthority(authorities, [Authority.PLATFORM_TENANTS_CREATE]);

export const canUpdatePlatformTenants = (authorities?: readonly AuthorityValue[] | null): boolean =>
  hasAnyAuthority(authorities, [Authority.PLATFORM_TENANTS_UPDATE]);

export const canReadPlatformUsers = (authorities?: readonly AuthorityValue[] | null): boolean =>
  PLATFORM_ROLES.some((role) => canManageRole(authorities, role, "read"));

export const canCreatePlatformUser = (
  authorities: readonly AuthorityValue[] | null | undefined,
  targetRole: string | null | undefined
): boolean => canManageRole(authorities, targetRole, "create");

export const canUpdatePlatformUser = (
  authorities: readonly AuthorityValue[] | null | undefined,
  targetRole: string | null | undefined
): boolean => canManageRole(authorities, targetRole, "update");

export const canReadTenantUsers = (authorities?: readonly AuthorityValue[] | null): boolean =>
  TENANT_ROLES.some((role) => canManageRole(authorities, role, "read"));

export const canCreateTenantUser = (
  authorities: readonly AuthorityValue[] | null | undefined,
  targetRole: string | null | undefined
): boolean => canManageRole(authorities, targetRole, "create");

export const canUpdateTenantUser = (
  authorities: readonly AuthorityValue[] | null | undefined,
  targetRole: string | null | undefined
): boolean => canManageRole(authorities, targetRole, "update");

export const getCreatablePlatformRoles = (authorities?: readonly AuthorityValue[] | null): PlatformRole[] =>
  getManageableRoles(authorities, PLATFORM_ROLES, "create");

export const getCreatableTenantRoles = (authorities?: readonly AuthorityValue[] | null): TenantRole[] =>
  getManageableRoles(authorities, TENANT_ROLES, "create");

export const getEditableTenantRoles = (authorities?: readonly AuthorityValue[] | null): TenantRole[] =>
  getManageableRoles(authorities, TENANT_ROLES, "update");
