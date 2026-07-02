import { get, post, put } from "@/services/ApiService";
import type { TenantRequest, TenantResponse, TenantUpdateRequest } from "../model/types";

const PLATFORM_TENANTS_BASE_URL = "/api/v1/platform/tenants";

export const createTenant = (request: TenantRequest): Promise<TenantResponse> =>
  post<TenantResponse>(PLATFORM_TENANTS_BASE_URL, request);

export const getAllTenants = (): Promise<TenantResponse[]> => get<TenantResponse[]>(PLATFORM_TENANTS_BASE_URL);

export const updateTenant = (tenantUuid: string, request: TenantUpdateRequest): Promise<TenantResponse> =>
  put<TenantResponse>(`${PLATFORM_TENANTS_BASE_URL}/${tenantUuid}`, request);
