import { AttendanceStatus } from "@prisma/client";

export function timeToMinutes(hm: string): number {
  const [h, m] = hm.split(":").map((x) => parseInt(x, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
}

/** 下班时间早于上班时间时按跨日处理（简化支持夜班） */
export function computeTotalWorkMinutes(
  clockIn: string | null | undefined,
  clockOut: string | null | undefined,
  breakDeductionMinutes: number,
  attendanceStatus: AttendanceStatus,
): number {
  if (attendanceStatus === "LEAVE") return 0;
  if (!clockIn || !clockOut) return 0;
  const start = timeToMinutes(clockIn);
  let end = timeToMinutes(clockOut);
  if (end <= start) end += 24 * 60;
  const gross = end - start;
  return Math.max(0, gross - (breakDeductionMinutes ?? 0));
}

export function formatMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${h}小时${m}分`;
}
