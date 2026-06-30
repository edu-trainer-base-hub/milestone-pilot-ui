import { Authority, type Authority as AuthorityValue } from "@/contexts/AuthContext";
import { hasAnyAuthority } from "@/lib/authorities";

export const canReadPlatformTenants = (authorities?: readonly AuthorityValue[] | null): boolean =>
  hasAnyAuthority(authorities, [Authority.PLATFORM_TENANTS_READ]);

export const canCreatePlatformTenants = (authorities?: readonly AuthorityValue[] | null): boolean =>
  hasAnyAuthority(authorities, [Authority.PLATFORM_TENANTS_CREATE]);

export const canUpdatePlatformTenants = (authorities?: readonly AuthorityValue[] | null): boolean =>
  hasAnyAuthority(authorities, [Authority.PLATFORM_TENANTS_UPDATE]);
