"use client";

import { useActionState } from "react";
import { submitMonthAction } from "./actions";

export function SubmitMonthButton({ yearMonth, disabled }: { yearMonth: string; disabled: boolean }) {
  const [state, action, pending] = useActionState(
    async () => submitMonthAction(yearMonth),
    null as { error?: string; ok?: boolean } | null,
  );

  if (disabled) {
    return <p className="text-sm text-slate-500">本月已提交。</p>;
  }

  return (
    <form action={action} className="space-y-2">
      {state?.error ? (
        <p className="text-sm text-red-600">{state.error}</p>
      ) : null}
      {state?.ok ? (
        <p className="text-sm text-emerald-700">提交成功。</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {pending ? "处理中…" : "提交本月考勤"}
      </button>
      <p className="text-xs text-slate-500">提交后本人不可再修改（管理员仍可修改）。</p>
    </form>
  );
}
