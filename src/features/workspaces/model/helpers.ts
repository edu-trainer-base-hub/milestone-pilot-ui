import { WorkspaceContextType, type Workspace } from "./types";

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
