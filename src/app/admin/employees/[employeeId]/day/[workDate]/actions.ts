"use server";

import {
  AttendanceStatus,
  SubmissionStatus,
  WorkDayType,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeTotalWorkMinutes } from "@/lib/work-time";

function parseEnum<T extends string>(val: string, allowed: T[], fallback: T): T {
  return allowed.includes(val as T) ? (val as T) : fallback;
}

export async function saveAdminAttendanceAction(formData: FormData) {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return { error: "无权限。" };
  }

  const employeeId = String(formData.get("employeeId") ?? "").trim();
  const workDate = String(formData.get("workDate") ?? "").trim();

  if (!employeeId || !/^\d{4}-\d{2}-\d{2}$/.test(workDate)) {
    return { error: "参数无效。" };
  }

  const emp = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!emp) return { error: "未找到员工。" };

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

  await prisma.attendanceRecord.upsert({
    where: { employeeId_workDate: { employeeId, workDate } },
    create: {
      employeeId,
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

  revalidatePath(`/admin/employees/${employeeId}`);
  revalidatePath(`/admin/employees/${employeeId}/day/${workDate}`);
  revalidatePath("/admin/submissions");
  return { ok: true as const };
}
