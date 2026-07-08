import { test, expect } from "@playwright/test";
import { API_BASE_URL } from "./helpers/auth";
import { getVerificationCode, uniqueTestEmail } from "./helpers/mailpit";

// Proves the Mailpit helper end-to-end at the API level: trigger a real
// verification email (code generation -> Thymeleaf rendering -> SMTP ->
// Mailpit) and extract the code. UI journeys reuse the helper in later specs.
//
// A unique recipient per run keeps this test parallel-safe and independent of
// leftover mail — no purging, no shared mailbox.
test("verification code can be fetched from Mailpit", async ({ request }) => {
  const email = uniqueTestEmail("verify");

  const response = await request.post(`${API_BASE_URL}/auth/email/verification/send`, {
    data: {
      email,
      verificationCodeType: "EMAIL_VERIFICATION_CODE_WEB",
    },
  });
  expect(response.ok(), `expect verification send to succeed (got HTTP ${response.status()})`).toBeTruthy();

  const code = await getVerificationCode(email);

  expect(code).toMatch(/^[A-Za-z0-9-]+$/);
});
