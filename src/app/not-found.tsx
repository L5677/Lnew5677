import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-6 text-center">
      <h1 className="text-3xl font-semibold text-slate-900">页面不存在</h1>
      <p className="mt-3 text-sm text-slate-600">你访问的地址无效或已被移动。</p>
      <Link
        href="/login"
        className="mt-6 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
      >
        返回登录页
      </Link>
    </main>
  );
}
