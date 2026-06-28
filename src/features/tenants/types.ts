export interface TenantRequest {
  name: string;
  description?: string;
  email: string;
  address: string;
  timezone: string;
  locale?: string;
  status?: string;
}

export interface TenantResponse {
  id: string;
  uuid?: string;
  name: string;
  description?: string;
  email: string;
  address: string;
  timezone: string;
  locale?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PlatformUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  platformRole: string;
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

export interface TenantUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface TenantUserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  tenantId: string;
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
} as const;

export type TenantRole = (typeof TenantRole)[keyof typeof TenantRole];

export interface UserRoleOption {
  value: string;
  label: string;
}

export const formatRoleLabel = (role: string): string => role.replace("ROLE_", "").replaceAll("_", " ");

export const getPlatformUserId = (user: Pick<PlatformUserResponse, "id" | "uuid">): string =>
  user.id ?? user.uuid ?? "";

export const getTenantMembershipId = (membership: Pick<TenantMembership, "tenantId" | "tenantUuid">): string | null =>
  membership.tenantId ?? membership.tenantUuid ?? null;

export const getTenantMembershipName = (membership: Pick<TenantMembership, "tenantName" | "name">): string =>
  membership.tenantName ?? membership.name ?? "";

export const isDefaultTenantMembership = (membership: Pick<TenantMembership, "isDefault" | "defaultTenant">): boolean =>
  Boolean(membership.isDefault ?? membership.defaultTenant);
