import { get, post, put } from "@/services/ApiService";
import type { TenantRequest, TenantResponse, TenantUserRequest, TenantUserResponse } from "./types";

const BASE_URL = "/api/v1/tenants";

export const createTenant = (request: TenantRequest): Promise<TenantResponse> =>
  post<TenantResponse>(BASE_URL, request);

export const getAllTenants = (): Promise<TenantResponse[]> => get<TenantResponse[]>(BASE_URL);

export const updateTenant = (id: string, request: TenantRequest): Promise<TenantResponse> =>
  put<TenantResponse>(`${BASE_URL}/${id}`, request);

export const createUserInTenant = (tenantId: string, request: TenantUserRequest): Promise<TenantUserResponse> =>
  post<TenantUserResponse>(`${BASE_URL}/${tenantId}/users`, request);

export const getUsersByTenant = (tenantId: string): Promise<TenantUserResponse[]> =>
  get<TenantUserResponse[]>(`${BASE_URL}/${tenantId}/users`);
