import { prisma } from "./prisma";

export async function isJapanPublicHoliday(dateStr: string): Promise<boolean> {
  const row = await prisma.holiday.findUnique({ where: { date: dateStr } });
  return !!row;
}

export async function getHolidayName(dateStr: string): Promise<string | null> {
  const row = await prisma.holiday.findUnique({ where: { date: dateStr } });
  return row?.name ?? null;
}

/** 0=周日 … 6=周六 */
export function getWeekdayJST(dateStr: string): number {
  const [y, mo, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, mo - 1, d, 12, 0, 0));
  return dt.getUTCDay();
}

export function isWeekendDate(dateStr: string): boolean {
  const w = getWeekdayJST(dateStr);
  return w === 0 || w === 6;
}
