export interface CreateTenantRequest {
  name: string;
  email: string;
  address: string;
  timezone: string;
  locale?: string;
  status?: string;
}

export interface UpdateTenantRequest {
  name: string;
  address: string;
}

export interface TenantResponse {
  id: number;
  uuid: string;
  name: string;
  email: string;
  address: string;
  timezone: string;
  locale?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePlatformUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface UpdatePlatformUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface PlatformUserResponse {
  id?: string;
  uuid?: string;
  email: string;
  firstName: string;
  lastName: string;
  platformRole: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTenantUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface UpdateTenantUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface TenantUserResponse {
  uuid: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TenantMembership {
  tenantId?: string | null;
  tenantUuid?: string | null;
  tenantName?: string | null;
  name?: string | null;
  role: string;
  isDefault?: boolean;
  defaultTenant?: boolean;
  isActive?: boolean;
}

export interface TenantMembershipListResponse {
  items: TenantMembership[];
}

export const PlatformRole = {
  ROLE_PLATFORM_ADMIN: "ROLE_PLATFORM_ADMIN",
  ROLE_PLATFORM_MANAGER: "ROLE_PLATFORM_MANAGER",
} as const;

export type PlatformRole = (typeof PlatformRole)[keyof typeof PlatformRole];

export const TenantRole = {
  ROLE_TENANT_ADMIN: "ROLE_TENANT_ADMIN",
  ROLE_TENANT_MANAGER: "ROLE_TENANT_MANAGER",
  ROLE_TENANT_USER: "ROLE_TENANT_USER",
} as const;

export type TenantRole = (typeof TenantRole)[keyof typeof TenantRole];

export interface UserRoleOption {
  value: string;
  label: string;
}

export const formatRoleLabel = (role: string): string => role.replace("ROLE_", "").replaceAll("_", " ");

export const getAssignableTenantRoles = (actorRole?: string | null): TenantRole[] => {
  switch (actorRole) {
    case TenantRole.ROLE_TENANT_ADMIN:
      return [TenantRole.ROLE_TENANT_MANAGER, TenantRole.ROLE_TENANT_USER];
    case TenantRole.ROLE_TENANT_MANAGER:
      return [TenantRole.ROLE_TENANT_USER];
    default:
      return [];
  }
};

export const canManageTenantUser = (actorRole?: string | null, targetRole?: string | null): boolean => {
  switch (actorRole) {
    case TenantRole.ROLE_TENANT_ADMIN:
      return targetRole === TenantRole.ROLE_TENANT_MANAGER || targetRole === TenantRole.ROLE_TENANT_USER;
    case TenantRole.ROLE_TENANT_MANAGER:
      return targetRole === TenantRole.ROLE_TENANT_USER;
    default:
      return false;
  }
};

export const getTenantRoleOptions = (actorRole?: string | null): UserRoleOption[] =>
  getAssignableTenantRoles(actorRole).map((role) => ({
    value: role,
    label: formatRoleLabel(role),
  }));

export const getPlatformUserId = (user: Pick<PlatformUserResponse, "id" | "uuid">): string =>
  user.id ?? user.uuid ?? "";

export const getTenantIdForPlatformOps = (tenant: Pick<TenantResponse, "id">): string => String(tenant.id);

export const getTenantUuidForTenantScopedOps = (tenant: Pick<TenantResponse, "uuid">): string => tenant.uuid;

export const getTenantUserId = (user: Pick<TenantUserResponse, "uuid">): string => user.uuid;

export const getTenantMembershipId = (membership: Pick<TenantMembership, "tenantId" | "tenantUuid">): string | null =>
  membership.tenantId ?? membership.tenantUuid ?? null;

export const getTenantMembershipName = (membership: Pick<TenantMembership, "tenantName" | "name">): string =>
  membership.tenantName ?? membership.name ?? "";

export const isDefaultTenantMembership = (membership: Pick<TenantMembership, "isDefault" | "defaultTenant">): boolean =>
  Boolean(membership.isDefault ?? membership.defaultTenant);
