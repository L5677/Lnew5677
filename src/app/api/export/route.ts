import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/** PDF 依赖 Node fs / 完整 fetch，勿使用 Edge */
export const runtime = "nodejs";
import * as XLSX from "xlsx";
import { Role } from "@prisma/client";
import {
  EXPORT_HEADERS_ZH,
  mapRecordToExportRowZh,
  type ExportRowZh,
} from "@/lib/attendance-export";
import { buildAttendancePdfZh } from "@/lib/export-pdf-zh";
import { prisma } from "@/lib/prisma";
import { daysInMonthYm } from "@/lib/date-jst";

const COOKIE = "ar_session";

function secretKey() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) throw new Error("SESSION_SECRET");
  return new TextEncoder().encode(s);
}

async function getAuth() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    const sub = payload.sub as string;
    const role = payload.role as Role;
    if (!sub || !role) return null;
    const user = await prisma.user.findUnique({ where: { id: sub } });
    if (!user) return null;
    return { user, role };
  } catch {
    return null;
  }
}

function csvEscapeCell(v: string): string {
  if (/[",\n\r]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

function filenameAscii(ym: string, suffix: string, scoped: boolean) {
  const scope = scoped ? "_part" : "_all";
  return `kaoqin_${ym}${scope}.${suffix}`;
}

export async function GET(req: Request) {
  const auth = await getAuth();
  if (!auth) {
    return NextResponse.json({ error: "未登录或会话无效" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const format = (searchParams.get("format") ?? "csv").toLowerCase();
  const ym = searchParams.get("ym") ?? "";
  let filterEmployeeId: string | null = searchParams.get("employeeId");

  if (!/^\d{4}-\d{2}$/.test(ym)) {
    return NextResponse.json({ error: "年月参数无效" }, { status: 400 });
  }

  if (auth.role === Role.EMPLOYEE) {
    filterEmployeeId = auth.user.employeeId;
    if (!filterEmployeeId) {
      return NextResponse.json({ error: "账号未关联员工" }, { status: 403 });
    }
  }

  const start = `${ym}-01`;
  const last = daysInMonthYm(ym);
  const end = `${ym}-${String(last).padStart(2, "0")}`;

  const where = {
    workDate: { gte: start, lte: end },
    ...(filterEmployeeId ? { employeeId: filterEmployeeId } : {}),
  };

  const rowsDb = await prisma.attendanceRecord.findMany({
    where,
    include: { employee: true },
    orderBy: [{ employeeId: "asc" }, { workDate: "asc" }],
  });

  const rowsZh: ExportRowZh[] = rowsDb.map(mapRecordToExportRowZh);
  const scoped = Boolean(filterEmployeeId);

  const disposition = (asciiName: string, utf8Name: string) =>
    `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(utf8Name)}`;

  if (format === "csv") {
    const headerLine = EXPORT_HEADERS_ZH.map(csvEscapeCell).join(",");
    const lines = [
      headerLine,
      ...rowsZh.map((row) =>
        EXPORT_HEADERS_ZH.map((h) => csvEscapeCell(row[h] ?? "")).join(","),
      ),
    ];
    const bom = "\uFEFF";
    const utf8Name = `考勤导出_${ym}${scoped ? "_本人" : "_全员"}.csv`;
    return new NextResponse(bom + lines.join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": disposition(filenameAscii(ym, "csv", scoped), utf8Name),
      },
    });
  }

  if (format === "xlsx") {
    const aoa = [
      [...EXPORT_HEADERS_ZH],
      ...rowsZh.map((row) => EXPORT_HEADERS_ZH.map((h) => row[h] ?? "")),
    ];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws["!cols"] = EXPORT_HEADERS_ZH.map((headerKey) => {
      const cellLens = rowsZh.map((r) => String(r[headerKey] ?? "").length);
      const maxLen = Math.max(headerKey.length, ...(cellLens.length ? cellLens : [0]));
      return { wch: Math.min(42, Math.max(10, maxLen + 2)) };
    });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "考勤明细");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    const utf8Name = `考勤导出_${ym}${scoped ? "_本人" : "_全员"}.xlsx`;
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": disposition(filenameAscii(ym, "xlsx", scoped), utf8Name),
      },
    });
  }

  if (format === "pdf") {
    try {
      const bytes = await buildAttendancePdfZh(rowsZh, ym);
      const utf8Name = `考勤导出_${ym}${scoped ? "_本人" : "_全员"}.pdf`;
      return new NextResponse(Buffer.from(bytes), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": disposition(filenameAscii(ym, "pdf", scoped), utf8Name),
        },
      });
    } catch (e) {
      console.error("PDF export:", e);
      const hint =
        "可执行 npm run pdf-font 将字体下载到 fonts/，或设置环境变量 CJK_FONT_PATH 指向 .otf 文件";
      const detail =
        process.env.NODE_ENV === "development" && e instanceof Error ? e.message : undefined;
      return NextResponse.json(
        { error: `PDF 生成失败。${hint}`, detail },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ error: "不支持的导出格式" }, { status: 400 });
}
