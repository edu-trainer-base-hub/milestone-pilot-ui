import { Authority, type Authority as AuthorityValue } from "@/contexts/AuthContext";

export const canViewEmailParsingLab = (authorities: readonly AuthorityValue[] | null | undefined): boolean =>
  Boolean(authorities?.includes(Authority.TENANT_INTEGRATIONS_READ));

export const canParseEmails = (authorities: readonly AuthorityValue[] | null | undefined): boolean =>
  Boolean(authorities?.includes(Authority.TENANT_INTEGRATIONS_MANAGE));
