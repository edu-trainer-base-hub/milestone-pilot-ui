import { get, post, put } from "@/services/ApiService";
import type { LoginResponse } from "@/services/AuthService";
import { getWorkspaceLabel, getWorkspaceTenantUuid, isDefaultWorkspace, isWorkspaceActive } from "../model/helpers";
import type { Workspace, WorkspaceContextType, WorkspaceListResponse } from "../model/types";

const AUTH_WORKSPACES_BASE_URL = "/auth/workspaces";

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
