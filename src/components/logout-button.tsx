import { logoutAction } from "@/app/actions/logout";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="rounded-lg border border-[var(--border)] bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
      >
        退出登录
      </button>
    </form>
  );
}
