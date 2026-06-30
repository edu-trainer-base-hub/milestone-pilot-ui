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
