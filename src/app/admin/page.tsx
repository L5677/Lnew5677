import Link from "next/link";
import { todayJstYmd } from "@/lib/date-jst";

export default function AdminHome() {
  const ym = todayJstYmd().slice(0, 7);
  return (
    <div>
      <h1 className="text-2xl font-semibold">管理后台</h1>
      <p className="mt-2 text-slate-600">可查看、修改员工考勤并导出数据。</p>
      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        <li>
          <Link
            href="/admin/employees"
            className="block rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm hover:border-blue-300"
          >
            <span className="font-medium">员工列表</span>
            <p className="mt-1 text-sm text-slate-600">进入各人月度页面</p>
          </Link>
        </li>
        <li>
          <Link
            href={`/admin/submissions?ym=${ym}`}
            className="block rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm hover:border-blue-300"
          >
            <span className="font-medium">提交情况（{ym}）</span>
            <p className="mt-1 text-sm text-slate-600">查看未提交与批量导出</p>
          </Link>
        </li>
      </ul>
    </div>
  );
}
