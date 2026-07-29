import { Authority, type Authority as AuthorityValue } from "@/contexts/AuthContext";

export const canViewBids = (authorities?: readonly AuthorityValue[] | null) =>
  Boolean(authorities?.includes(Authority.UI_TENANT_BIDS_VIEW) && authorities.includes(Authority.TENANT_BIDS_READ));
export const canCreateBids = (authorities?: readonly AuthorityValue[] | null) =>
  Boolean(authorities?.includes(Authority.TENANT_BIDS_CREATE));
export const canUpdateBids = (authorities?: readonly AuthorityValue[] | null) =>
  Boolean(authorities?.includes(Authority.TENANT_BIDS_UPDATE));
export const canViewBidAudit = (authorities?: readonly AuthorityValue[] | null) =>
  Boolean(authorities?.includes(Authority.TENANT_BIDS_VIEW_AUDIT));
