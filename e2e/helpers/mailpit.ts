// Mailpit is the fake SMTP server of the e2e environment: the backend sends
// real mail to it, nothing leaves the machine. Web UI: http://localhost:8025
// Contract: milestonepilot-api/docs/E2E.md

export const MAILPIT_BASE_URL = "http://localhost:8025";

// Both backend email templates render the code as:
//   <div class="confirmation-code">483920</div>
const CONFIRMATION_CODE_PATTERN = /confirmation-code[^>]*>\s*([A-Za-z0-9-]+)\s*</;

interface MailpitSearchMessage {
  ID: string;
  Subject: string;
}

interface MailpitMessage {
  Subject: string;
  HTML: string;
}

export interface WaitOptions {
  timeoutMs?: number;
  pollIntervalMs?: number;
}

/**
 * Polls Mailpit until a message addressed to `recipient` exists and returns
 * the newest one (Mailpit sorts newest first). Throws after the timeout.
 */
export async function waitForMessage(
  recipient: string,
  { timeoutMs = 15_000, pollIntervalMs = 500 }: WaitOptions = {}
): Promise<MailpitMessage> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const searchResponse = await fetch(
      `${MAILPIT_BASE_URL}/api/v1/search?query=${encodeURIComponent(`to:${recipient}`)}`
    );
    const { messages } = (await searchResponse.json()) as { messages: MailpitSearchMessage[] | null };

    if (messages && messages.length > 0) {
      const messageResponse = await fetch(`${MAILPIT_BASE_URL}/api/v1/message/${messages[0].ID}`);
      return (await messageResponse.json()) as MailpitMessage;
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error(
    `No email arrived for ${recipient} within ${timeoutMs}ms. ` +
      `Is the backend running with the e2e profile (spring.mail -> localhost:1025)? ` +
      `Inspect the mailbox at ${MAILPIT_BASE_URL}`
  );
}

/**
 * Waits for the newest email to `recipient` and extracts the verification code
 * from its HTML body.
 */
export async function getVerificationCode(recipient: string, options?: WaitOptions): Promise<string> {
  const message = await waitForMessage(recipient, options);

  const match = message.HTML.match(CONFIRMATION_CODE_PATTERN);
  if (!match) {
    throw new Error(
      `Email for ${recipient} (subject: "${message.Subject}") contains no ` +
        `<div class="confirmation-code"> element — template changed? See ${MAILPIT_BASE_URL}`
    );
  }
  return match[1];
}

/**
 * Deletes ALL messages in Mailpit — including mail other parallel tests are
 * waiting for. Prefer uniqueTestEmail() recipients over purging; reach for
 * this only in serially-run maintenance/debug scenarios.
 */
export async function purgeMailbox(): Promise<void> {
  await fetch(`${MAILPIT_BASE_URL}/api/v1/messages`, { method: "DELETE" });
}

let uniqueCounter = 0;

/**
 * Unique, unroutable recipient address per call (reserved .test TLD) —
 * keeps tests independent of leftover data and of each other.
 */
export function uniqueTestEmail(prefix = "user"): string {
  uniqueCounter += 1;
  return `${prefix}-${Date.now()}-${uniqueCounter}@e2e.test`;
}
