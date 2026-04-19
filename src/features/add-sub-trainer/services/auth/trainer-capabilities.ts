export type Capability = {
  isAvailable: boolean;
  reason?: "auth-required" | "premium-required";
};

export function checkTrainerCapability(_userId: string | null): Capability {
  // Mock logic - in a real app, read from auth context or entitlements
  return { isAvailable: true };
}
