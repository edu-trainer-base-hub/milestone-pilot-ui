import { checkTrainerCapability, type Capability } from "../services/auth/trainer-capabilities";

export function useCapabilityAccess(userId: string | null = null): Capability {
  // In a real app this would use context or a hook like useAuth()
  return checkTrainerCapability(userId);
}
