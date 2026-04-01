import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { todayJstYmd } from "@/lib/date-jst";
import { isJapanPublicHoliday } from "@/lib/holidays";
import { AttendanceForm } from "./attendance-form";

type Props = { searchParams: Promise<{ date?: string }> };

export default async function AttendancePage({ searchParams }: Props) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  const workDate = sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : todayJstYmd();

  if (!user?.employeeId) {
    return null;
  }

  const record = await prisma.attendanceRecord.findUnique({
    where: {
      employeeId_workDate: { employeeId: user.employeeId, workDate },
    },
  });

  const suggestedPublicHoliday = await isJapanPublicHoliday(workDate);

  const monthly = await prisma.monthlySubmission.findUnique({
    where: {
      employeeId_yearMonth: {
        employeeId: user.employeeId,
        yearMonth: workDate.slice(0, 7),
      },
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold">每日考勤填报</h1>
      <p className="mt-1 text-sm text-slate-600">请选择日期后保存。URL 参数：<code className="text-xs">?date=YYYY-MM-DD</code></p>

      {monthly?.status === "SUBMITTED" ? (
        <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
          本月已提交。如需修改请联系管理员。
        </p>
      ) : null}

      <div className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <AttendanceForm
          workDate={workDate}
          record={record}
          suggestedPublicHoliday={suggestedPublicHoliday}
        />
      </div>
    </div>
  );
}
