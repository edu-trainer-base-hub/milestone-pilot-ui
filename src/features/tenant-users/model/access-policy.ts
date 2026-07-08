import { Authority, type Authority as AuthorityValue } from "@/contexts/AuthContext";
import { hasAnyAuthority } from "@/lib/authorities";
import { TenantRole } from "./types";

type CrudAction = "create" | "read" | "update";

const ROLE_AUTHORITY_MATRIX: Record<TenantRole, Record<CrudAction, AuthorityValue>> = {
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

const TENANT_ROLES = [
  TenantRole.ROLE_TENANT_ADMIN,
  TenantRole.ROLE_TENANT_MANAGER,
  TenantRole.ROLE_TENANT_USER,
] as const;

const canManageRole = (
  authorities: readonly AuthorityValue[] | null | undefined,
  targetRole: string | null | undefined,
  action: CrudAction
): boolean => {
  if (!targetRole) {
    return false;
  }

  const matchingAuthority = ROLE_AUTHORITY_MATRIX[targetRole as TenantRole]?.[action];
  return matchingAuthority ? hasAnyAuthority(authorities, [matchingAuthority]) : false;
};

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

export const getCreatableTenantRoles = (authorities?: readonly AuthorityValue[] | null): TenantRole[] =>
  TENANT_ROLES.filter((role) => canManageRole(authorities, role, "create"));

export const getEditableTenantRoles = (authorities?: readonly AuthorityValue[] | null): TenantRole[] =>
  TENANT_ROLES.filter((role) => canManageRole(authorities, role, "update"));
