/** 按日本时区（Asia/Tokyo）的今日日期 YYYY-MM-DD */
export function todayJstYmd(): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = fmt.formatToParts(new Date());
  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const d = parts.find((p) => p.type === "day")?.value;
  return `${y}-${m}-${d}`;
}

export function daysInMonthYm(ym: string): number {
  const [y, mo] = ym.split("-").map(Number);
  return new Date(y, mo, 0).getDate();
}

export function ymFromDateStr(dateStr: string): string {
  return dateStr.slice(0, 7);
}
