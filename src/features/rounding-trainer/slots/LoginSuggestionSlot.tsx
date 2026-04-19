import React from "react";
import { useRoundingTrainerCapabilities } from "../hooks/useRoundingTrainerCapabilities";
import { useRoundingTrainerAnalytics } from "../hooks/useRoundingTrainerAnalytics";

interface LoginSuggestionSlotProps {
  placement: string;
  children?: React.ReactNode;
}

/**
 * Extension slot.
 * Attach a login CTA panel here when product enables it.
 */
export function LoginSuggestionSlot({ placement, children = null }: LoginSuggestionSlotProps) {
  const { capabilities } = useRoundingTrainerCapabilities();
  const analytics = useRoundingTrainerAnalytics();
  const shouldRender = capabilities.shouldShowLoginSuggestion && Boolean(children);

  React.useEffect(() => {
    if (!shouldRender) return;
    analytics.trackLoginSuggestionShown(placement);
  }, [analytics, placement, shouldRender]);

  if (!shouldRender) return null;
  return <>{children}</>;
}
