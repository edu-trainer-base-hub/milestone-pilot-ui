import type { Authority } from "@/contexts/AuthContext";

const normalizeAuthorities = (authorities?: readonly Authority[] | null): readonly Authority[] => authorities ?? [];

export const hasAnyAuthority = (
  authorities?: readonly Authority[] | null,
  required?: readonly Authority[] | null
): boolean => {
  if (!required?.length) {
    return false;
  }

  const authoritySet = new Set(normalizeAuthorities(authorities));
  return required.some((authority) => authoritySet.has(authority));
};
