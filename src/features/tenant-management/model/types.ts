export interface TenantRequest {
  name: string;
  email: string;
  address: string;
  timezone: string;
  locale?: string;
}

export interface TenantUpdateRequest {
  name: string;
  address: string;
  timezone: string;
  locale?: string;
  status: "ACTIVE" | "SUSPENDED" | "ARCHIVED";
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
