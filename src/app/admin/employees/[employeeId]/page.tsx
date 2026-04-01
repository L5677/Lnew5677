import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { daysInMonthYm, todayJstYmd } from "@/lib/date-jst";
import { formatMinutes } from "@/lib/work-time";

type Props = {
  params: Promise<{ employeeId: string }>;
  searchParams: Promise<{ ym?: string }>;
};

export default async function AdminEmployeeMonthPage({ params, searchParams }: Props) {
  const { employeeId } = await params;
  const sp = await searchParams;
  const ym =
    sp.ym && /^\d{4}-\d{2}$/.test(sp.ym) ? sp.ym : todayJstYmd().slice(0, 7);

  const emp = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!emp) notFound();

  const start = `${ym}-01`;
  const last = daysInMonthYm(ym);
  const end = `${ym}-${String(last).padStart(2, "0")}`;

  const records = await prisma.attendanceRecord.findMany({
    where: { employeeId, workDate: { gte: start, lte: end } },
    orderBy: { workDate: "asc" },
  });

  const map = new Map(records.map((r) => [r.workDate, r]));

  const monthly = await prisma.monthlySubmission.findUnique({
    where: { employeeId_yearMonth: { employeeId, yearMonth: ym } },
  });

  const days: { ymd: string; label: string }[] = [];
  for (let d = 1; d <= last; d++) {
    const ymd = `${ym}-${String(d).padStart(2, "0")}`;
    days.push({ ymd, label: String(d) });
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{emp.name}</h1>
          <p className="mt-1 text-sm text-slate-600">
            {emp.code} {emp.department ? `· ${emp.department}` : ""}
          </p>
        </div>
        <Link href="/admin/employees" className="text-sm text-[var(--accent)] hover:underline">
          返回列表
        </Link>
      </div>

      <form method="get" className="mt-6 flex flex-wrap items-center gap-2">
        <label className="text-sm text-slate-600">月份</label>
        <input
          type="month"
          name="ym"
          defaultValue={ym}
          className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-white hover:bg-slate-900"
        >
          查询
        </button>
      </form>

      <p className="mt-4 text-sm text-slate-600">
        月度提交：<strong>{monthly?.status === "SUBMITTED" ? "已提交" : "未提交"}</strong>
      </p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--card)]">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[var(--border)] bg-slate-50">
            <tr>
              <th className="px-3 py-2 font-medium text-slate-600">日</th>
              <th className="px-3 py-2 font-medium text-slate-600">上班〜下班</th>
              <th className="px-3 py-2 font-medium text-slate-600">总工时</th>
              <th className="px-3 py-2 font-medium text-slate-600">状态</th>
              <th className="px-3 py-2 font-medium text-slate-600" />
            </tr>
          </thead>
          <tbody>
            {days.map(({ ymd, label }) => {
              const r = map.get(ymd);
              return (
                <tr key={ymd} className="border-b border-[var(--border)] last:border-0">
                  <td className="px-3 py-2 font-mono text-xs">
                    {ymd} <span className="text-slate-400">({label})</span>
                  </td>
                  <td className="px-3 py-2">
                    {r ? (
                      <>
                        {r.clockIn ?? "—"} 〜 {r.clockOut ?? "—"}
                      </>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {r ? formatMinutes(r.totalWorkMinutes) : "—"}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {r ? (r.attendanceStatus === "LEAVE" ? "休假" : "出勤") : "—"}
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/admin/employees/${employeeId}/day/${ymd}`}
                      className="text-[var(--accent)] hover:underline"
                    >
                      编辑
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
