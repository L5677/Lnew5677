"use server";

import {
  AttendanceStatus,
  SubmissionStatus,
  WorkDayType,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { isJapanPublicHoliday } from "@/lib/holidays";
import { prisma } from "@/lib/prisma";
import { ymFromDateStr } from "@/lib/date-jst";
import { computeTotalWorkMinutes } from "@/lib/work-time";

function parseEnum<T extends string>(val: string, allowed: T[], fallback: T): T {
  return allowed.includes(val as T) ? (val as T) : fallback;
}

export async function saveAttendanceAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user?.employeeId) {
    return { error: "无员工信息。" };
  }

  const workDate = String(formData.get("workDate") ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(workDate)) {
    return { error: "日期无效。" };
  }

  const attendanceStatus = parseEnum(
    String(formData.get("attendanceStatus") ?? ""),
    ["PRESENT", "LEAVE"] as const,
    "PRESENT",
  );

  const workDayType = parseEnum(
    String(formData.get("workDayType") ?? ""),
    ["WEEKDAY", "WEEKEND_WORK", "PUBLIC_HOLIDAY_WORK"] as const,
    "WEEKDAY",
  );

  const clockInRaw = String(formData.get("clockIn") ?? "").trim();
  const clockOutRaw = String(formData.get("clockOut") ?? "").trim();
  const clockIn = clockInRaw || null;
  const clockOut = clockOutRaw || null;

  const breakDeductionMinutes = Math.max(
    0,
    parseInt(String(formData.get("breakDeductionMinutes") ?? "0"), 10) || 0,
  );

  const isPublicHoliday = formData.get("isPublicHoliday") === "on";

  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (attendanceStatus === "PRESENT" && (!clockIn || !clockOut)) {
    return { error: "正常出勤时请填写上班、下班时间。" };
  }

  const totalWorkMinutes = computeTotalWorkMinutes(
    clockIn,
    clockOut,
    breakDeductionMinutes,
    attendanceStatus as AttendanceStatus,
  );

  const monthly = await prisma.monthlySubmission.findUnique({
    where: {
      employeeId_yearMonth: {
        employeeId: user.employeeId,
        yearMonth: ymFromDateStr(workDate),
      },
    },
  });

  if (monthly?.status === "SUBMITTED") {
    return { error: "本月已提交，本人无法修改，请联系管理员。" };
  }

  await prisma.attendanceRecord.upsert({
    where: {
      employeeId_workDate: { employeeId: user.employeeId, workDate },
    },
    create: {
      employeeId: user.employeeId,
      workDate,
      clockIn,
      clockOut,
      breakDeductionMinutes,
      attendanceStatus: attendanceStatus as AttendanceStatus,
      workDayType: workDayType as WorkDayType,
      isPublicHoliday,
      totalWorkMinutes,
      notes,
      submissionStatus: SubmissionStatus.DRAFT,
    },
    update: {
      clockIn,
      clockOut,
      breakDeductionMinutes,
      attendanceStatus: attendanceStatus as AttendanceStatus,
      workDayType: workDayType as WorkDayType,
      isPublicHoliday,
      totalWorkMinutes,
      notes,
    },
  });

  revalidatePath("/employee/attendance");
  revalidatePath("/employee/history");
  revalidatePath(`/employee/summary/${ymFromDateStr(workDate)}`);
  return { ok: true as const };
}

/** 供界面使用：根据祝日主数据建议是否勾选 */
export async function suggestedHolidayForDate(workDate: string) {
  return isJapanPublicHoliday(workDate);
}
