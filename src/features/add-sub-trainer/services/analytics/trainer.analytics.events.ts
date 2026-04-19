import type { AnalyticsEvent } from "./trainer.analytics.types";

export function trackEvent(event: AnalyticsEvent) {
  // Mock external analytics integration
  console.log(`[Analytics] ${event.name}`, event.payload);
}
