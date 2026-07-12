import { Authority, type Authority as AuthorityValue } from "@/contexts/AuthContext";

export const canReadEmailConnectors = (authorities: readonly AuthorityValue[] | null | undefined): boolean =>
  Boolean(authorities?.includes(Authority.TENANT_INTEGRATIONS_READ));

export const canManageEmailConnectors = (authorities: readonly AuthorityValue[] | null | undefined): boolean =>
  Boolean(authorities?.includes(Authority.TENANT_INTEGRATIONS_MANAGE));
