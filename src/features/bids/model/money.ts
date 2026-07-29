const MAX_CENTS = 9223372036854775807n;

function separators(locale: string) {
  const parts = new Intl.NumberFormat(locale).formatToParts(12345.6);
  return {
    decimal: parts.find((p) => p.type === "decimal")?.value ?? ".",
    group: parts.find((p) => p.type === "group")?.value ?? ",",
  };
}

export function parseMoneyToCents(input: string, locale = "en"): string | null {
  const value = input.trim().replace(/[\u00a0\u202f]/g, " ");
  if (!value) return null;
  if (!/^[0-9., ]+$/.test(value)) throw new Error("invalidMoney");
  const { decimal, group: localeGroup } = separators(locale);
  const group = /\s/u.test(localeGroup) ? " " : localeGroup;
  let decimalMark = "";
  const dots = value.split(".").length - 1;
  const commas = value.split(",").length - 1;
  if (dots && commas) decimalMark = decimal;
  else {
    const mark = dots ? "." : commas ? "," : "";
    if (mark) {
      const count = dots || commas;
      const tail = value.slice(value.lastIndexOf(mark) + 1);
      if (count === 1 && (mark === decimal || tail.length <= 2)) decimalMark = mark;
      else if (mark !== group) throw new Error("invalidMoney");
    }
  }
  const parts = decimalMark ? value.split(decimalMark) : [value];
  if (parts.length > 2) throw new Error("invalidMoney");
  const [integer, fraction = ""] = parts;
  if (decimalMark && !/^\d{1,2}$/.test(fraction)) throw new Error("invalidMoney");
  let digits = integer;
  if (!/^\d+$/.test(integer)) {
    const groups = integer.split(group);
    if (groups.length < 2 || !/^\d{1,3}$/.test(groups[0]) || groups.slice(1).some((part) => !/^\d{3}$/.test(part))) {
      throw new Error("invalidMoney");
    }
    digits = groups.join("");
  }
  const cents = BigInt(digits) * 100n + BigInt(fraction.padEnd(2, "0"));
  if (cents > MAX_CENTS) throw new Error("moneyOverflow");
  return cents.toString();
}

export function centsToDecimal(cents: string | null | undefined): string {
  if (cents == null) return "";
  const value = BigInt(cents);
  return `${value / 100n}.${String(value % 100n).padStart(2, "0")}`;
}

export function formatMoney(cents: string | null | undefined, locale = "en"): string {
  if (cents == null) return "—";
  const value = BigInt(cents);
  const formatter = new Intl.NumberFormat(locale, { style: "currency", currency: "USD", minimumFractionDigits: 2 });
  return formatter
    .formatToParts(value / 100n)
    .map((part) => (part.type === "fraction" ? String(value % 100n).padStart(2, "0") : part.value))
    .join("");
}
