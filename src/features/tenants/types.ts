export interface TenantRequest {
  name: string;
  description?: string;
  email: string;
  address: string;
}

export interface TenantResponse {
  id: string;
  name: string;
  description?: string;
  email: string;
  address: string;
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

export const TenantRole = {
  ROLE_PLATFORM_ADMIN: "ROLE_PLATFORM_ADMIN",
  ROLE_PLATFORM_MANAGER: "ROLE_PLATFORM_MANAGER",
  ROLE_TENANT_ADMIN: "ROLE_TENANT_ADMIN",
  ROLE_TENANT_MANAGER: "ROLE_TENANT_MANAGER",
} as const;

export type TenantRole = (typeof TenantRole)[keyof typeof TenantRole];
