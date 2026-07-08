import { Authority, type Authority as AuthorityValue } from "@/contexts/AuthContext";
import { hasAnyAuthority } from "@/lib/authorities";
import { PlatformRole } from "./types";

type CrudAction = "create" | "read" | "update";

const ROLE_AUTHORITY_MATRIX: Record<PlatformRole, Record<CrudAction, AuthorityValue>> = {
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
};

const PLATFORM_ROLES = [PlatformRole.ROLE_PLATFORM_ADMIN, PlatformRole.ROLE_PLATFORM_MANAGER] as const;

const canManageRole = (
  authorities: readonly AuthorityValue[] | null | undefined,
  targetRole: string | null | undefined,
  action: CrudAction
): boolean => {
  if (!targetRole) {
    return false;
  }

  const matchingAuthority = ROLE_AUTHORITY_MATRIX[targetRole as PlatformRole]?.[action];
  return matchingAuthority ? hasAnyAuthority(authorities, [matchingAuthority]) : false;
};

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

export const getCreatablePlatformRoles = (authorities?: readonly AuthorityValue[] | null): PlatformRole[] =>
  PLATFORM_ROLES.filter((role) => canManageRole(authorities, role, "create"));
