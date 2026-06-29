import { get, post, put } from "@/services/ApiService";
import type { LoginResponse } from "@/services/AuthService";
import type {
  CreatePlatformUserRequest,
  CreateTenantRequest,
  CreateTenantUserRequest,
  PlatformUserResponse,
  TenantResponse,
  TenantUserResponse,
  UpdatePlatformUserRequest,
  UpdateTenantRequest,
  UpdateTenantUserRequest,
  Workspace,
  WorkspaceContextType,
  WorkspaceListResponse,
} from "./types";
import { getWorkspaceLabel, getWorkspaceTenantUuid, isDefaultWorkspace, isWorkspaceActive } from "./types";

const PLATFORM_TENANTS_BASE_URL = "/api/v1/platform/tenants";
const PLATFORM_USERS_BASE_URL = "/api/v1/platform/users";
const TENANT_USERS_BASE_URL = "/api/v1/tenants";
const AUTH_WORKSPACES_BASE_URL = "/auth/workspaces";

export const createTenant = (request: CreateTenantRequest): Promise<TenantResponse> =>
  post<TenantResponse>(PLATFORM_TENANTS_BASE_URL, request);

export const getAllTenants = (): Promise<TenantResponse[]> => get<TenantResponse[]>(PLATFORM_TENANTS_BASE_URL);

export const updateTenant = (id: string, request: UpdateTenantRequest): Promise<TenantResponse> =>
  put<TenantResponse>(`${PLATFORM_TENANTS_BASE_URL}/${id}`, request);

export const createPlatformUser = (request: CreatePlatformUserRequest): Promise<PlatformUserResponse> =>
  post<PlatformUserResponse>(PLATFORM_USERS_BASE_URL, request);

export const getPlatformUsers = (): Promise<PlatformUserResponse[]> =>
  get<PlatformUserResponse[]>(PLATFORM_USERS_BASE_URL);

export const updatePlatformUser = (userId: string, request: UpdatePlatformUserRequest): Promise<PlatformUserResponse> =>
  put<PlatformUserResponse>(`${PLATFORM_USERS_BASE_URL}/${userId}`, request);

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

export interface WorkspaceSelectionRequest {
  contextType: WorkspaceContextType;
  tenantUuid?: string | null;
}

const normalizeWorkspace = (workspace: Workspace): Workspace => ({
  ...workspace,
  tenantUuid: getWorkspaceTenantUuid(workspace),
  tenantId: workspace.tenantId ?? workspace.tenantUuid ?? null,
  tenantName: getWorkspaceLabel(workspace),
  isActive: isWorkspaceActive(workspace),
  isDefault: isDefaultWorkspace(workspace),
});

export const getCurrentUserWorkspaces = async (): Promise<Workspace[]> => {
  const response = await get<Workspace[] | WorkspaceListResponse>(AUTH_WORKSPACES_BASE_URL);
  const workspaces = Array.isArray(response) ? response : response.items;
  return workspaces.map(normalizeWorkspace);
};

export const switchWorkspace = async (request: WorkspaceSelectionRequest): Promise<LoginResponse> =>
  post<LoginResponse>(`${AUTH_WORKSPACES_BASE_URL}/switch`, request);

export const setDefaultWorkspace = async (request: WorkspaceSelectionRequest): Promise<void> => {
  await put(`${AUTH_WORKSPACES_BASE_URL}/default`, request);
};
