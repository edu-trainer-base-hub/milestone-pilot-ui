import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import type { FeatureFlag } from "@/services/FeatureFlagService";

interface FeatureFlagRouteProps {
  flag: FeatureFlag;
}

/**
 * Route guard for feature-flagged pages (UX only — the backend enforces the flag on its
 * APIs). Renders nothing while the flags are loading to avoid a redirect flash.
 */
const FeatureFlagRoute: React.FC<FeatureFlagRouteProps> = ({ flag }) => {
  const { isFeatureEnabled, isLoading } = useFeatureFlags();

  if (isLoading) {
    return null;
  }

  if (!isFeatureEnabled(flag)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default FeatureFlagRoute;
