import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 shadow-sm">
        <h1 className="text-xl font-semibold tracking-tight">考勤填报系统</h1>
        <p className="mt-1 text-sm text-slate-600">请使用公司账号登录</p>
        <LoginForm />
        <p className="mt-6 text-xs text-slate-500">
          演示账号：admin@company.local / yamada@company.local — 密码{" "}
          <code className="rounded bg-slate-100 px-1">demo123</code>
        </p>
      </div>
    </div>
  );
}
