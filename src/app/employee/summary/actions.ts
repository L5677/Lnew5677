"use server";

import { SubmissionStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { daysInMonthYm } from "@/lib/date-jst";
import { prisma } from "@/lib/prisma";

export async function submitMonthAction(yearMonth: string) {
  const user = await getCurrentUser();
  if (!user?.employeeId) {
    return { error: "无员工信息。" };
  }

  if (!/^\d{4}-\d{2}$/.test(yearMonth)) {
    return { error: "年月无效。" };
  }

  const start = `${yearMonth}-01`;
  const endDay = daysInMonthYm(yearMonth);
  const end = `${yearMonth}-${String(endDay).padStart(2, "0")}`;

  await prisma.$transaction([
    prisma.monthlySubmission.upsert({
      where: {
        employeeId_yearMonth: { employeeId: user.employeeId, yearMonth },
      },
      create: {
        employeeId: user.employeeId,
        yearMonth,
        status: SubmissionStatus.SUBMITTED,
        submittedAt: new Date(),
      },
      update: {
        status: SubmissionStatus.SUBMITTED,
        submittedAt: new Date(),
      },
    }),
    prisma.attendanceRecord.updateMany({
      where: {
        employeeId: user.employeeId,
        workDate: { gte: start, lte: end },
      },
      data: {
        submissionStatus: SubmissionStatus.SUBMITTED,
        submittedAt: new Date(),
      },
    }),
  ]);

  revalidatePath(`/employee/summary/${yearMonth}`);
  revalidatePath("/employee/history");
  return { ok: true as const };
}
