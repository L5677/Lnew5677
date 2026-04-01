import type { AttendanceRecord, AttendanceStatus, SubmissionStatus, WorkDayType } from "@prisma/client";

/** 导出用中文列顺序（与 PDF 列宽一致） */
export const EXPORT_HEADERS_ZH = [
  "工号",
  "姓名",
  "日期",
  "上班",
  "下班",
  "扣除(分钟)",
  "出勤状态",
  "勤务类型",
  "日本法定节假日",
  "总工时(分钟)",
  "记录提交状态",
  "备注",
] as const;

export type ExportHeaderZh = (typeof EXPORT_HEADERS_ZH)[number];

export type ExportRowZh = Record<ExportHeaderZh, string>;

const STATUS_ATT: Record<AttendanceStatus, string> = {
  PRESENT: "正常出勤",
  LEAVE: "休假/缺勤",
};

const STATUS_DAY: Record<WorkDayType, string> = {
  WEEKDAY: "平日出勤",
  WEEKEND_WORK: "休息日出勤",
  PUBLIC_HOLIDAY_WORK: "法定节假日出勤",
};

const STATUS_SUB: Record<SubmissionStatus, string> = {
  DRAFT: "草稿",
  SUBMITTED: "已提交",
};

export function mapRecordToExportRowZh(
  r: AttendanceRecord & { employee: { code: string; name: string } },
): ExportRowZh {
  return {
  工号: r.employee.code,
  姓名: r.employee.name,
  日期: r.workDate,
  上班: r.clockIn ?? "",
  下班: r.clockOut ?? "",
  "扣除(分钟)": String(r.breakDeductionMinutes),
  出勤状态: STATUS_ATT[r.attendanceStatus],
  勤务类型: STATUS_DAY[r.workDayType],
  日本法定节假日: r.isPublicHoliday ? "是" : "否",
  "总工时(分钟)": String(r.totalWorkMinutes),
  记录提交状态: STATUS_SUB[r.submissionStatus],
  备注: (r.notes ?? "").replace(/\r?\n/g, " ").trim(),
  };
}

export function rowZhToArray(row: ExportRowZh): string[] {
  return EXPORT_HEADERS_ZH.map((h) => row[h]);
}

/** PDF 列宽（pt），总和约 762，适配 A4 横向 */
export const PDF_COL_WIDTHS = [
  48, 52, 54, 36, 36, 40, 52, 72, 44, 44, 44, 140,
] as const;
