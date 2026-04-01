import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { todayJstYmd } from "@/lib/date-jst";

export default async function AdminEmployeesPage() {
  const employees = await prisma.employee.findMany({ orderBy: { code: "asc" } });
  const ym = todayJstYmd().slice(0, 7);

  return (
    <div>
      <h1 className="text-2xl font-semibold">员工列表</h1>
      <div className="mt-6 overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--card)]">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[var(--border)] bg-slate-50">
            <tr>
              <th className="px-4 py-2 font-medium text-slate-600">工号</th>
              <th className="px-4 py-2 font-medium text-slate-600">姓名</th>
              <th className="px-4 py-2 font-medium text-slate-600">部门</th>
              <th className="px-4 py-2 font-medium text-slate-600" />
            </tr>
          </thead>
          <tbody>
            {employees.map((e) => (
              <tr key={e.id} className="border-b border-[var(--border)] last:border-0">
                <td className="px-4 py-2 font-mono text-xs">{e.code}</td>
                <td className="px-4 py-2">{e.name}</td>
                <td className="px-4 py-2 text-slate-600">{e.department ?? "—"}</td>
                <td className="px-4 py-2">
                  <Link
                    href={`/admin/employees/${e.id}?ym=${ym}`}
                    className="text-[var(--accent)] hover:underline"
                  >
                    打开月度
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
