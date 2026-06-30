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
