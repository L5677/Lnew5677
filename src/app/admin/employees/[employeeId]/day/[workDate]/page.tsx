import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isJapanPublicHoliday } from "@/lib/holidays";
import { AdminAttendanceForm } from "./admin-attendance-form";

type Props = {
  params: Promise<{ employeeId: string; workDate: string }>;
};

export default async function AdminDayPage({ params }: Props) {
  const { employeeId, workDate } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(workDate)) notFound();

  const emp = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!emp) notFound();

  const record = await prisma.attendanceRecord.findUnique({
    where: { employeeId_workDate: { employeeId, workDate } },
  });

  const suggestedPublicHoliday = await isJapanPublicHoliday(workDate);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3 text-sm">
        <Link
          href={`/admin/employees/${employeeId}?ym=${workDate.slice(0, 7)}`}
          className="text-[var(--accent)] hover:underline"
        >
          ← 返回月度
        </Link>
        <span className="text-slate-400">|</span>
        <span className="font-medium">{emp.name}</span>
        <span className="font-mono text-slate-600">{workDate}</span>
      </div>
      <h1 className="text-2xl font-semibold">按日编辑（管理员）</h1>
      <div className="mt-6 max-w-xl rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <AdminAttendanceForm
          employeeId={employeeId}
          workDate={workDate}
          record={record}
          suggestedPublicHoliday={suggestedPublicHoliday}
        />
      </div>
    </div>
  );
}
