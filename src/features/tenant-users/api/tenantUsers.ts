import { get, post, put } from "@/services/ApiService";
import type { CreateTenantUserRequest, TenantUserResponse, UpdateTenantUserRequest } from "../model/types";

const TENANT_USERS_BASE_URL = "/api/v1/tenants";

export const createUserInTenant = (tenantId: string, request: CreateTenantUserRequest): Promise<TenantUserResponse> =>
  post<TenantUserResponse>(`${TENANT_USERS_BASE_URL}/${tenantId}/users`, request);

export const getUsersByTenant = (tenantId: string): Promise<TenantUserResponse[]> =>
  get<TenantUserResponse[]>(`${TENANT_USERS_BASE_URL}/${tenantId}/users`);

export const updateUserInTenant = (
  tenantId: string,
  userId: string,
  request: UpdateTenantUserRequest
): Promise<TenantUserResponse> =>
  put<TenantUserResponse>(`${TENANT_USERS_BASE_URL}/${tenantId}/users/${userId}`, request);
