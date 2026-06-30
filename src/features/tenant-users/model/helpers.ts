import type { TenantResponse } from "@/features/tenant-management/model/types";
import type { TenantUserResponse } from "./types";

export const getTenantUuidForTenantScopedOps = (tenant: Pick<TenantResponse, "uuid">): string => tenant.uuid;

export const getTenantUserId = (user: Pick<TenantUserResponse, "uuid">): string => user.uuid;
