import type { TenantResponse } from "./types";

export const getTenantUuidForPlatformOps = (tenant: Pick<TenantResponse, "uuid">): string => String(tenant.uuid);
