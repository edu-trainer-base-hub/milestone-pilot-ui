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

export interface CreatePlatformUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface UpdatePlatformUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface PlatformUserResponse {
  id?: string;
  uuid?: string;
  email: string;
  firstName: string;
  lastName: string;
  platformRole: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTenantUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface UpdateTenantUserRequest {
  email: string;
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

export const WorkspaceContextType = {
  PLATFORM: "PLATFORM",
  TENANT: "TENANT",
} as const;

export type WorkspaceContextType = (typeof WorkspaceContextType)[keyof typeof WorkspaceContextType];

export interface Workspace {
  contextType: WorkspaceContextType;
  tenantUuid?: string | null;
  tenantId?: string | null;
  tenantName?: string | null;
  workspaceName?: string | null;
  name?: string | null;
  role: string;
  isActive?: boolean;
  isDefault?: boolean;
  activeWorkspace?: boolean;
  defaultWorkspace?: boolean;
  defaultTenant?: boolean;
}

export interface WorkspaceListResponse {
  items: Workspace[];
}

export const PlatformRole = {
  ROLE_PLATFORM_ADMIN: "ROLE_PLATFORM_ADMIN",
  ROLE_PLATFORM_MANAGER: "ROLE_PLATFORM_MANAGER",
} as const;

export type PlatformRole = (typeof PlatformRole)[keyof typeof PlatformRole];

export const TenantRole = {
  ROLE_TENANT_ADMIN: "ROLE_TENANT_ADMIN",
  ROLE_TENANT_MANAGER: "ROLE_TENANT_MANAGER",
  ROLE_TENANT_USER: "ROLE_TENANT_USER",
} as const;

export type TenantRole = (typeof TenantRole)[keyof typeof TenantRole];

export interface UserRoleOption {
  value: string;
  label: string;
}

export const formatRoleLabel = (role: string): string => role.replace("ROLE_", "").replaceAll("_", " ");

export const getPlatformUserId = (user: Pick<PlatformUserResponse, "id" | "uuid">): string =>
  user.id ?? user.uuid ?? "";

export const getTenantIdForPlatformOps = (tenant: Pick<TenantResponse, "id">): string => String(tenant.id);

export const getTenantUuidForTenantScopedOps = (tenant: Pick<TenantResponse, "uuid">): string => tenant.uuid;

export const getTenantUserId = (user: Pick<TenantUserResponse, "uuid">): string => user.uuid;

export const getWorkspaceKey = (workspace: Pick<Workspace, "contextType" | "tenantUuid" | "tenantId">): string =>
  workspace.contextType === WorkspaceContextType.PLATFORM
    ? WorkspaceContextType.PLATFORM
    : (workspace.tenantUuid ?? workspace.tenantId ?? "tenant-workspace");

export const getWorkspaceTenantUuid = (workspace: Pick<Workspace, "tenantUuid" | "tenantId">): string | null =>
  workspace.tenantUuid ?? workspace.tenantId ?? null;

export const getWorkspaceLabel = (
  workspace: Pick<Workspace, "tenantName" | "workspaceName" | "name" | "contextType">
): string =>
  workspace.tenantName ??
  workspace.workspaceName ??
  workspace.name ??
  (workspace.contextType === WorkspaceContextType.PLATFORM ? "Platform" : "");

export const isWorkspaceActive = (workspace: Pick<Workspace, "isActive" | "activeWorkspace">): boolean =>
  Boolean(workspace.isActive ?? workspace.activeWorkspace);

export const isDefaultWorkspace = (
  workspace: Pick<Workspace, "isDefault" | "defaultWorkspace" | "defaultTenant">
): boolean => Boolean(workspace.isDefault ?? workspace.defaultWorkspace ?? workspace.defaultTenant);

export const isPlatformWorkspace = (workspace: Pick<Workspace, "contextType">): boolean =>
  workspace.contextType === WorkspaceContextType.PLATFORM;
