import { describe, expect, it } from "vitest";
import { centsToDecimal, formatMoney, parseMoneyToCents } from "./money";

describe("USD cents", () => {
  it.each([
    ["1234.56", "en", "123456"],
    ["1234,56", "en", "123456"],
    ["1,234.56", "en", "123456"],
    ["1,234", "en", "123400"],
    ["1 234,56", "uk", "123456"],
    ["1\u00a0234,56", "ru", "123456"],
    ["1234.56", "uk", "123456"],
    ["0", "en", "0"],
    ["0.29", "en", "29"],
    ["92233720368547758.07", "en", "9223372036854775807"],
  ])("parses %s (%s) exactly", (input, locale, cents) => expect(parseMoneyToCents(input, locale)).toBe(cents));

  it.each(["-1", "1.234", "1,23,456", "12,34.56", "1 234.56", "1e3", "1.", "1.2.3", "92233720368547758.08"])(
    "rejects %s",
    (input) => {
      expect(() => parseMoneyToCents(input, "en")).toThrow();
    }
  );

  it("uses locale for ambiguous separators and preserves empty, zero, and the full Long range", () => {
    expect(() => parseMoneyToCents("1,234", "uk")).toThrow();
    expect(parseMoneyToCents(" ")).toBeNull();
    expect(centsToDecimal("0")).toBe("0.00");
    expect(formatMoney("29", "en")).toBe("$0.29");
    expect(formatMoney("9223372036854775807", "en")).toBe("$92,233,720,368,547,758.07");
    expect(centsToDecimal("9223372036854775807")).toBe("92233720368547758.07");
  });
});
