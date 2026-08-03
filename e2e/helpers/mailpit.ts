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
 * Polls until an email to `recipient` containing a verification code arrives
 * and returns the code. Emails without a code (e.g. the account-setup mail,
 * whose code div is empty) are skipped, so the code email may arrive later
 * than others.
 */
export async function getVerificationCode(
  recipient: string,
  { timeoutMs = 15_000, pollIntervalMs = 500 }: WaitOptions = {}
): Promise<string> {
  const deadline = Date.now() + timeoutMs;
  const seenSubjects = new Set<string>();

  while (Date.now() < deadline) {
    const searchResponse = await fetch(
      `${MAILPIT_BASE_URL}/api/v1/search?query=${encodeURIComponent(`to:${recipient}`)}`
    );
    const { messages } = (await searchResponse.json()) as { messages: MailpitSearchMessage[] | null };

    // Newest first; only the few most recent are relevant
    for (const summary of (messages ?? []).slice(0, 5)) {
      const messageResponse = await fetch(`${MAILPIT_BASE_URL}/api/v1/message/${summary.ID}`);
      const message = (await messageResponse.json()) as MailpitMessage;
      seenSubjects.add(message.Subject);

      const match = message.HTML.match(CONFIRMATION_CODE_PATTERN);
      if (match) {
        return match[1];
      }
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  const seen = seenSubjects.size > 0 ? `Emails without a code arrived: ${[...seenSubjects].join(", ")}. ` : "";
  throw new Error(
    `No verification-code email arrived for ${recipient} within ${timeoutMs}ms. ${seen}` +
      `Is the backend running with the e2e profile? Inspect the mailbox at ${MAILPIT_BASE_URL}`
  );
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
 * Worker index guards against same-millisecond collisions across the
 * parallel worker processes.
 */
export function uniqueTestEmail(prefix = "user"): string {
  uniqueCounter += 1;
  const worker = process.env.TEST_PARALLEL_INDEX ?? "0";
  return `${prefix}-w${worker}-${Date.now()}-${uniqueCounter}@e2e.test`;
}
