import { describe, expect, it } from "vitest";
import { Authority } from "@/contexts/AuthContext";
import { canParseEmails, canViewEmailParsingLab } from "./access-policy";

describe("email-parsing access policy", () => {
  it("allows viewing with TENANT_INTEGRATIONS_READ", () => {
    expect(canViewEmailParsingLab([Authority.TENANT_INTEGRATIONS_READ])).toBe(true);
    expect(canViewEmailParsingLab([Authority.TENANT_INTEGRATIONS_MANAGE])).toBe(false);
  });

  it("allows parsing only with TENANT_INTEGRATIONS_MANAGE", () => {
    expect(canParseEmails([Authority.TENANT_INTEGRATIONS_MANAGE])).toBe(true);
    expect(canParseEmails([Authority.TENANT_INTEGRATIONS_READ])).toBe(false);
  });

  it("denies for empty or missing authorities", () => {
    expect(canViewEmailParsingLab([])).toBe(false);
    expect(canViewEmailParsingLab(null)).toBe(false);
    expect(canParseEmails(undefined)).toBe(false);
  });
});
