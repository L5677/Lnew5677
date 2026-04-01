"use client";

import { useActionState } from "react";
import type { AttendanceRecord } from "@prisma/client";
import { saveAdminAttendanceAction } from "./actions";

type State = { error?: string; ok?: boolean } | null;

export function AdminAttendanceForm({
  employeeId,
  workDate,
  record,
  suggestedPublicHoliday,
}: {
  employeeId: string;
  workDate: string;
  record: AttendanceRecord | null;
  suggestedPublicHoliday: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    async (_: State, fd: FormData) => saveAdminAttendanceAction(fd),
    null as State,
  );

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="employeeId" value={employeeId} />
      <input type="hidden" name="workDate" value={workDate} />

      {state?.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      ) : null}
      {state?.ok ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">已保存。</p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700">上班</label>
          <input
            type="time"
            name="clockIn"
            defaultValue={record?.clockIn ?? ""}
            className="mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">下班</label>
          <input
            type="time"
            name="clockOut"
            defaultValue={record?.clockOut ?? ""}
            className="mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">中途扣除（分钟）</label>
        <input
          type="number"
          name="breakDeductionMinutes"
          min={0}
          defaultValue={record?.breakDeductionMinutes ?? 60}
          className="mt-1 w-32 rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">出勤状态</label>
        <select
          name="attendanceStatus"
          defaultValue={record?.attendanceStatus ?? "PRESENT"}
          className="mt-1 w-full max-w-xs rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
        >
          <option value="PRESENT">正常出勤</option>
          <option value="LEAVE">休假 / 缺勤</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">勤务类型</label>
        <select
          name="workDayType"
          defaultValue={record?.workDayType ?? "WEEKDAY"}
          className="mt-1 w-full max-w-xs rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
        >
          <option value="WEEKDAY">平日出勤</option>
          <option value="WEEKEND_WORK">休息日出勤</option>
          <option value="PUBLIC_HOLIDAY_WORK">法定节假日出勤</option>
        </select>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isPublicHoliday"
          defaultChecked={record?.isPublicHoliday ?? suggestedPublicHoliday}
        />
        当日为日本法定节假日
      </label>

      <div>
        <label className="block text-sm font-medium text-slate-700">备注</label>
        <textarea
          name="notes"
          rows={2}
          defaultValue={record?.notes ?? ""}
          className="mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
        />
      </div>

      <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700">
        总工时（分钟）：<strong>{record?.totalWorkMinutes ?? "—"}</strong>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-60"
      >
        {pending ? "保存中…" : "保存（管理员）"}
      </button>
    </form>
  );
}
