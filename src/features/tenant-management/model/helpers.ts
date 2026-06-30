import type { TenantResponse } from "./types";

export const getTenantIdForPlatformOps = (tenant: Pick<TenantResponse, "id">): string => String(tenant.id);
