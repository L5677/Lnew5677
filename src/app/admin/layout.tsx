import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";
import { getCurrentUser } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--border)] bg-[var(--card)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <nav className="flex flex-wrap items-center gap-4 text-sm font-medium">
            <Link href="/admin" className="text-slate-900">
              管理首页
            </Link>
            <Link href="/admin/employees" className="text-slate-600 hover:text-slate-900">
              员工列表
            </Link>
            <Link href="/admin/submissions" className="text-slate-600 hover:text-slate-900">
              提交情况
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-slate-500 sm:inline">{user.email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
