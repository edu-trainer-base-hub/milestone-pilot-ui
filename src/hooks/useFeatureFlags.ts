import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { getFeatureFlags, type FeatureFlag } from "@/services/FeatureFlagService";

/**
 * Feature flags of the current tenant context. The query key includes the active tenant
 * UUID, so a workspace switch automatically refetches the flags.
 */
export const useFeatureFlags = () => {
  const { isAuthenticated, principal } = useAuth();
  const tenantId = principal?.activeTenantUuid ?? null;

  const { data, isLoading } = useQuery({
    queryKey: ["featureFlags", tenantId],
    queryFn: getFeatureFlags,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

  const isFeatureEnabled = (flag: FeatureFlag): boolean => Boolean(data?.flags?.[flag]);

  return { isFeatureEnabled, isLoading };
};
