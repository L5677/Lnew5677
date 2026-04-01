import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

export default async function EmployeeHome() {
  const user = await getCurrentUser();
  const ym = new Date().toISOString().slice(0, 7);

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">你好，{user?.employee?.name ?? ""}</h1>
      <p className="mt-2 text-slate-600">请记录今日考勤，或查看历史记录与月度汇总。</p>
      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        <li>
          <Link
            href="/employee/attendance"
            className="block rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm transition hover:border-blue-300"
          >
            <span className="font-medium text-slate-900">每日考勤填报</span>
            <p className="mt-1 text-sm text-slate-600">记录上下班、扣除与出勤状态</p>
          </Link>
        </li>
        <li>
          <Link
            href="/employee/history"
            className="block rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm transition hover:border-blue-300"
          >
            <span className="font-medium text-slate-900">历史记录</span>
            <p className="mt-1 text-sm text-slate-600">查看与修改已填记录</p>
          </Link>
        </li>
        <li className="sm:col-span-2">
          <Link
            href={`/employee/summary/${ym}`}
            className="block rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm transition hover:border-blue-300"
          >
            <span className="font-medium text-slate-900">月度汇总（{ym}）</span>
            <p className="mt-1 text-sm text-slate-600">查看合计工时并提交当月</p>
          </Link>
        </li>
      </ul>
    </div>
  );
}
