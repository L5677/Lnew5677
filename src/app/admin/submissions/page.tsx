import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { daysInMonthYm, todayJstYmd } from "@/lib/date-jst";

type Props = { searchParams: Promise<{ ym?: string }> };

export default async function SubmissionsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const ym =
    sp.ym && /^\d{4}-\d{2}$/.test(sp.ym) ? sp.ym : todayJstYmd().slice(0, 7);

  const employees = await prisma.employee.findMany({ orderBy: { code: "asc" } });

  const start = `${ym}-01`;
  const last = daysInMonthYm(ym);
  const end = `${ym}-${String(last).padStart(2, "0")}`;

  const [records, monthlies] = await Promise.all([
    prisma.attendanceRecord.findMany({
      where: { workDate: { gte: start, lte: end } },
      select: { employeeId: true, workDate: true },
    }),
    prisma.monthlySubmission.findMany({ where: { yearMonth: ym } }),
  ]);

  const countByEmployee = new Map<string, number>();
  for (const r of records) {
    countByEmployee.set(r.employeeId, (countByEmployee.get(r.employeeId) ?? 0) + 1);
  }

  const monthlyByEmployee = new Map(monthlies.map((m) => [m.employeeId, m]));

  return (
    <div>
      <h1 className="text-2xl font-semibold">提交情况</h1>
      <form method="get" className="mt-4 flex flex-wrap items-center gap-2">
        <label className="text-sm text-slate-600">月份</label>
        <input
          type="month"
          name="ym"
          defaultValue={ym}
          className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-white"
        >
          查询
        </button>
      </form>

      <div className="mt-6 flex flex-wrap gap-3">
        <a
          href={`/api/export?${new URLSearchParams({ format: "csv", ym }).toString()}`}
          className="rounded-lg border border-[var(--border)] bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
        >
          全员 CSV
        </a>
        <a
          href={`/api/export?${new URLSearchParams({ format: "xlsx", ym }).toString()}`}
          className="rounded-lg border border-[var(--border)] bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
        >
          全员 Excel
        </a>
        <a
          href={`/api/export?${new URLSearchParams({ format: "pdf", ym }).toString()}`}
          className="rounded-lg border border-[var(--border)] bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
        >
          全员 PDF
        </a>
      </div>

      <div className="mt-8 overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--card)]">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[var(--border)] bg-slate-50">
            <tr>
              <th className="px-4 py-2 font-medium text-slate-600">员工</th>
              <th className="px-4 py-2 font-medium text-slate-600">当月记录数</th>
              <th className="px-4 py-2 font-medium text-slate-600">月度提交</th>
              <th className="px-4 py-2 font-medium text-slate-600" />
            </tr>
          </thead>
          <tbody>
            {employees.map((e) => {
              const m = monthlyByEmployee.get(e.id);
              const cnt = countByEmployee.get(e.id) ?? 0;
              const eq = new URLSearchParams({ format: "csv", ym, employeeId: e.id });
              return (
                <tr key={e.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="px-4 py-2">
                    <span className="font-medium">{e.name}</span>
                    <span className="ml-2 font-mono text-xs text-slate-500">{e.code}</span>
                  </td>
                  <td className="px-4 py-2">{cnt}</td>
                  <td className="px-4 py-2">
                    {m?.status === "SUBMITTED" ? (
                      <span className="text-emerald-700">已提交</span>
                    ) : (
                      <span className="text-amber-700">未提交</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/admin/employees/${e.id}?ym=${ym}`}
                        className="text-[var(--accent)] hover:underline"
                      >
                        月度
                      </Link>
                      <a
                        href={`/api/export?${eq.toString()}`}
                        className="text-slate-600 hover:underline"
                      >
                        CSV
                      </a>
                    </div>
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
