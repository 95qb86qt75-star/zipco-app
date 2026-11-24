import { describe, expect, it } from "vitest";
import { formatQuoteRespondedAt } from "./quoteResponseTime";

const localDate = (
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
) => new Date(year, month - 1, day, hour, minute);

describe("formatQuoteRespondedAt", () => {
  const now = localDate(2026, 10, 7, 18, 0);

  it("formats a response from today", () => {
    expect(
      formatQuoteRespondedAt(localDate(2026, 10, 7, 17, 34).toISOString(), now),
    ).toBe("Respondió hoy, 17:34");
  });

  it("formats a response from yesterday", () => {
    expect(
      formatQuoteRespondedAt(localDate(2026, 10, 6, 16, 20).toISOString(), now),
    ).toBe("Respondió ayer, 16:20");
  });

  it("formats an older response with its short date", () => {
    expect(
      formatQuoteRespondedAt(localDate(2026, 10, 5, 11, 10).toISOString(), now),
    ).toBe("Respondió 5 oct, 11:10");
  });

  it.each([null, undefined])("returns null when the timestamp is %s", (value) => {
    expect(formatQuoteRespondedAt(value, now)).toBeNull();
  });

  it("returns null for an invalid timestamp", () => {
    expect(formatQuoteRespondedAt("not-a-date", now)).toBeNull();
  });
});
