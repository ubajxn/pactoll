const DAY_MS = 24 * 60 * 60 * 1000;

function calendarDay(date: Date) {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS;
}

export function formatMessageTime(
  timestamp: string,
  now = new Date(),
  locale?: Intl.LocalesArgument,
) {
  const sentAt = new Date(timestamp);
  if (Number.isNaN(sentAt.getTime())) return "";

  const time = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(sentAt);
  const daysAgo = calendarDay(now) - calendarDay(sentAt);

  if (daysAgo === 0) return time;
  if (daysAgo > 0 && daysAgo <= 6) {
    const weekday = new Intl.DateTimeFormat(locale, {
      weekday: "long",
    }).format(sentAt);
    return `${weekday} ${time}`;
  }

  const date = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(sentAt);
  return `${date} ${time}`;
}
