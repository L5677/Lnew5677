import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";
import { getCurrentUser } from "@/lib/auth";

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "EMPLOYEE") {
    redirect("/login");
  }
  if (!user.employee) {
    return (
      <div className="p-8">
        <p className="text-red-600">账号未关联员工档案，请联系管理员。</p>
        <LogoutButton />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--border)] bg-[var(--card)]">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3">
          <nav className="flex flex-wrap items-center gap-4 text-sm font-medium">
            <Link href="/employee" className="text-slate-900">
              首页
            </Link>
            <Link href="/employee/attendance" className="text-slate-600 hover:text-slate-900">
              每日填报
            </Link>
            <Link href="/employee/history" className="text-slate-600 hover:text-slate-900">
              历史记录
            </Link>
            <Link
              href={`/employee/summary/${new Date().toISOString().slice(0, 7)}`}
              className="text-slate-600 hover:text-slate-900"
            >
              月度汇总
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-slate-500 sm:inline">{user.employee.name}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
    </div>
  );
}
