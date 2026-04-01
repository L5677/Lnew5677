import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { daysInMonthYm } from "@/lib/date-jst";
import { formatMinutes } from "@/lib/work-time";
import { SubmitMonthButton } from "../submit-month-button";

type Props = { params: Promise<{ ym: string }> };

export default async function SummaryPage({ params }: Props) {
  const { ym } = await params;
  if (!/^\d{4}-\d{2}$/.test(ym)) notFound();

  const user = await getCurrentUser();
  if (!user?.employeeId) return null;

  const start = `${ym}-01`;
  const last = daysInMonthYm(ym);
  const end = `${ym}-${String(last).padStart(2, "0")}`;

  const records = await prisma.attendanceRecord.findMany({
    where: {
      employeeId: user.employeeId,
      workDate: { gte: start, lte: end },
    },
    orderBy: { workDate: "asc" },
  });

  const monthly = await prisma.monthlySubmission.findUnique({
    where: {
      employeeId_yearMonth: { employeeId: user.employeeId, yearMonth: ym },
    },
  });

  const totalMinutes = records.reduce((s, r) => s + r.totalWorkMinutes, 0);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">月度汇总</h1>
          <p className="mt-1 font-mono text-slate-600">{ym}</p>
        </div>
        <Link href="/employee" className="text-sm text-[var(--accent)] hover:underline">
          返回首页
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <p className="text-xs text-slate-500">记录条数</p>
          <p className="mt-1 text-2xl font-semibold">{records.length}</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <p className="text-xs text-slate-500">总工时（当月已填）</p>
          <p className="mt-1 text-2xl font-semibold">{formatMinutes(totalMinutes)}</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <p className="text-xs text-slate-500">月度提交状态</p>
          <p className="mt-1 text-lg font-semibold">
            {monthly?.status === "SUBMITTED" ? "已提交" : "未提交"}
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="text-sm font-semibold text-slate-800">提交本月</h2>
        <div className="mt-4">
          <SubmitMonthButton yearMonth={ym} disabled={monthly?.status === "SUBMITTED"} />
        </div>
        <div className="mt-6 border-t border-[var(--border)] pt-4">
          <p className="text-sm font-medium text-slate-800">导出（本人数据）</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <a
              href={`/api/export?format=csv&ym=${ym}`}
              className="rounded-lg border border-[var(--border)] bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
            >
              CSV
            </a>
            <a
              href={`/api/export?format=xlsx&ym=${ym}`}
              className="rounded-lg border border-[var(--border)] bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
            >
              Excel
            </a>
            <a
              href={`/api/export?format=pdf&ym=${ym}`}
              className="rounded-lg border border-[var(--border)] bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
            >
              PDF
            </a>
          </div>
        </div>
      </div>

      <div className="mt-8 overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--card)]">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[var(--border)] bg-slate-50 text-slate-600">
            <tr>
              <th className="px-3 py-2 font-medium">日期</th>
              <th className="px-3 py-2 font-medium">上班〜下班</th>
              <th className="px-3 py-2 font-medium">总工时</th>
              <th className="px-3 py-2 font-medium">状态</th>
              <th className="px-3 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                  本月尚无记录
                </td>
              </tr>
            ) : (
              records.map((r) => (
                <tr key={r.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="px-3 py-2 font-mono text-xs">{r.workDate}</td>
                  <td className="px-3 py-2">
                    {r.clockIn ?? "—"} 〜 {r.clockOut ?? "—"}
                  </td>
                  <td className="px-3 py-2">{formatMinutes(r.totalWorkMinutes)}</td>
                  <td className="px-3 py-2 text-xs">
                    {r.attendanceStatus === "LEAVE" ? "休假" : "出勤"}
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/employee/attendance?date=${r.workDate}`}
                      className="text-[var(--accent)] hover:underline"
                    >
                      编辑
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
