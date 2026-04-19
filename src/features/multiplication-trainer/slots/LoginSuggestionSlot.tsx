import { useCapabilityAccess } from "../hooks/useCapabilityAccess";

/**
 * Slot component – renders nothing until a real login CTA is designed.
 * In the future this will show a panel suggesting the user to log in
 * with a prompt to "Log in to save your history" based on capability tier.
 */
export function LoginSuggestionSlot() {
  const { tier } = useCapabilityAccess();

  if (tier !== "guest") return null;

  // Placeholder for future logic
  return null;
}
