import { get, post, put } from "@/services/ApiService";
import type {
  PlatformUserRequest,
  PlatformUserResponse,
  TenantMembership,
  TenantMembershipListResponse,
  TenantRequest,
  TenantResponse,
  TenantUserRequest,
  TenantUserResponse,
} from "./types";

const PLATFORM_TENANTS_BASE_URL = "/api/v1/platform/tenants";
const PLATFORM_USERS_BASE_URL = "/api/v1/platform/users";
const TENANT_USERS_BASE_URL = "/api/v1/tenants";
const AUTH_TENANTS_BASE_URL = "/auth/tenants";

export const createTenant = (request: TenantRequest): Promise<TenantResponse> =>
  post<TenantResponse>(PLATFORM_TENANTS_BASE_URL, request);

export const getAllTenants = (): Promise<TenantResponse[]> => get<TenantResponse[]>(PLATFORM_TENANTS_BASE_URL);

export const updateTenant = (id: string, request: TenantRequest): Promise<TenantResponse> =>
  put<TenantResponse>(`${PLATFORM_TENANTS_BASE_URL}/${id}`, request);

export const createPlatformUser = (request: PlatformUserRequest): Promise<PlatformUserResponse> =>
  post<PlatformUserResponse>(PLATFORM_USERS_BASE_URL, request);

export const getPlatformUsers = (): Promise<PlatformUserResponse[]> =>
  get<PlatformUserResponse[]>(PLATFORM_USERS_BASE_URL);

export const updatePlatformUser = (userId: string, request: PlatformUserRequest): Promise<PlatformUserResponse> =>
  put<PlatformUserResponse>(`${PLATFORM_USERS_BASE_URL}/${userId}`, request);

export const createUserInTenant = (tenantId: string, request: TenantUserRequest): Promise<TenantUserResponse> =>
  post<TenantUserResponse>(`${TENANT_USERS_BASE_URL}/${tenantId}/users`, request);

export const getUsersByTenant = (tenantId: string): Promise<TenantUserResponse[]> =>
  get<TenantUserResponse[]>(`${TENANT_USERS_BASE_URL}/${tenantId}/users`);

export const updateUserInTenant = (
  tenantId: string,
  userId: string,
  request: TenantUserRequest
): Promise<TenantUserResponse> =>
  put<TenantUserResponse>(`${TENANT_USERS_BASE_URL}/${tenantId}/users/${userId}`, request);

export const getCurrentUserTenantMemberships = async (): Promise<TenantMembership[]> => {
  const response = await get<TenantMembership[] | TenantMembershipListResponse>(AUTH_TENANTS_BASE_URL);

  const memberships = Array.isArray(response) ? response : response.items;

  return memberships.map((membership) => ({
    ...membership,
    tenantUuid: membership.tenantUuid ?? membership.tenantId ?? null,
    tenantId: membership.tenantId ?? membership.tenantUuid ?? null,
    tenantName: membership.tenantName ?? membership.name ?? "",
    isDefault: membership.isDefault ?? membership.defaultTenant ?? false,
  }));
};

export const setDefaultTenant = async (tenantId: string): Promise<void> => {
  await post(`${AUTH_TENANTS_BASE_URL}/${tenantId}/default`);
};
