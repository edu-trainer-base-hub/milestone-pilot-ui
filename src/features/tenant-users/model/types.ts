export interface CreateTenantUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface UpdateTenantUserRequest {
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

export const TenantRole = {
  ROLE_TENANT_ADMIN: "ROLE_TENANT_ADMIN",
  ROLE_TENANT_MANAGER: "ROLE_TENANT_MANAGER",
  ROLE_TENANT_USER: "ROLE_TENANT_USER",
} as const;

export type TenantRole = (typeof TenantRole)[keyof typeof TenantRole];
