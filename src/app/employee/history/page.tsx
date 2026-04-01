import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { formatMinutes } from "@/lib/work-time";

export default async function HistoryPage() {
  const user = await getCurrentUser();
  if (!user?.employeeId) return null;

  const records = await prisma.attendanceRecord.findMany({
    where: { employeeId: user.employeeId },
    orderBy: { workDate: "desc" },
    take: 120,
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold">历史记录</h1>
      <p className="mt-1 text-sm text-slate-600">最近 120 条（新的在前）</p>
      <div className="mt-6 overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--card)]">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[var(--border)] bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-2 font-medium">日期</th>
              <th className="px-4 py-2 font-medium">上班〜下班</th>
              <th className="px-4 py-2 font-medium">扣除(分)</th>
              <th className="px-4 py-2 font-medium">状态</th>
              <th className="px-4 py-2 font-medium">总工时</th>
              <th className="px-4 py-2 font-medium">提交</th>
              <th className="px-4 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  尚无记录
                </td>
              </tr>
            ) : (
              records.map((r) => (
                <tr key={r.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="px-4 py-2 font-mono text-xs">{r.workDate}</td>
                  <td className="px-4 py-2">
                    {r.clockIn ?? "—"} 〜 {r.clockOut ?? "—"}
                  </td>
                  <td className="px-4 py-2">{r.breakDeductionMinutes}</td>
                  <td className="px-4 py-2">
                    {r.attendanceStatus === "LEAVE" ? "休假" : "出勤"}
                  </td>
                  <td className="px-4 py-2">{formatMinutes(r.totalWorkMinutes)}</td>
                  <td className="px-4 py-2 text-xs">
                    {r.submissionStatus === "SUBMITTED" ? "已提交" : "草稿"}
                  </td>
                  <td className="px-4 py-2">
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
