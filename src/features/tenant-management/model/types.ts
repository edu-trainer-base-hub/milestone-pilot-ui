export const TenantStatus = {
    ACTIVE: "ACTIVE",
    SUSPENDED: "SUSPENDED",
    ARCHIVED: "ARCHIVED",
} as const;

export type TenantStatus = (typeof TenantStatus)[keyof typeof TenantStatus];

export const TENANT_STATUS_OPTIONS: TenantStatus[] = Object.values(TenantStatus);

export interface CreateTenantRequest {
  name: string;
  email: string;
  address: string;
  timezone: string;
  locale?: string;
}

export interface UpdateTenantRequest {
  name: string;
  address: string;
  timezone: string;
  locale?: string;
  status: TenantStatus;
}

export interface TenantResponse {
  id: number;
  uuid: string;
  name: string;
  email: string;
  address: string;
  timezone: string;
  locale?: string;
  status?: TenantStatus;
  createdAt?: string;
  updatedAt?: string;
}
