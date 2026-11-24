const locale = "es-CL";

function sameCalendarDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function formatTime(value: Date) {
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(value);
}

function formatShortDate(value: Date) {
  const parts = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
  }).formatToParts(value);
  const day = parts.find((part) => part.type === "day")?.value;
  const month = parts
    .find((part) => part.type === "month")
    ?.value.replace(/\.$/, "")
    .toLocaleLowerCase(locale);

  return day && month ? `${day} ${month}` : null;
}

export function formatQuoteRespondedAt(
  respondedAt: string | null | undefined,
  now = new Date(),
): string | null {
  if (!respondedAt) return null;

  const responseDate = new Date(respondedAt);
  if (
    Number.isNaN(responseDate.getTime()) ||
    Number.isNaN(now.getTime())
  ) {
    return null;
  }

  const time = formatTime(responseDate);
  if (sameCalendarDay(responseDate, now)) {
    return `Respondió hoy, ${time}`;
  }

  const yesterday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 1,
  );
  if (sameCalendarDay(responseDate, yesterday)) {
    return `Respondió ayer, ${time}`;
  }

  const date = formatShortDate(responseDate);
  return date ? `Respondió ${date}, ${time}` : null;
}
