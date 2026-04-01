import fontkit from "@pdf-lib/fontkit";
import fs from "fs";
import path from "path";
import { PDFDocument, PDFFont, rgb, type PDFPage } from "pdf-lib";
import {
  EXPORT_HEADERS_ZH,
  PDF_COL_WIDTHS,
  rowZhToArray,
  type ExportRowZh,
} from "./attendance-export";

const FONT_URLS = [
  "https://cdn.jsdelivr.net/gh/notofonts/noto-cjk@main/Sans/SubsetOTF/SC/NotoSansSC-Regular.otf",
  "https://fastly.jsdelivr.net/gh/notofonts/noto-cjk@main/Sans/SubsetOTF/SC/NotoSansSC-Regular.otf",
  "https://raw.githubusercontent.com/notofonts/noto-cjk/main/Sans/SubsetOTF/SC/NotoSansSC-Regular.otf",
];

let cachedFontBytes: Uint8Array | null = null;

async function fetchFontFromNetwork(): Promise<Uint8Array> {
  const MIN_BYTES = 1_000_000;
  const errors: string[] = [];
  for (const url of FONT_URLS) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 180000);
    try {
      const res = await fetch(url, {
        redirect: "follow",
        signal: ctrl.signal,
        headers: { "User-Agent": "attendance-report-pdf/1.0" },
      });
      if (!res.ok) {
        errors.push(`${url}: HTTP ${res.status}`);
        continue;
      }
      const buf = new Uint8Array(await res.arrayBuffer());
      if (buf.length < MIN_BYTES) {
        errors.push(`${url}: 响应过小 ${buf.length}`);
        continue;
      }
      return buf;
    } catch (e) {
      errors.push(`${url}: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error(errors.join(" | ") || "无法下载字体");
}

async function loadCjkFontBytes(): Promise<Uint8Array> {
  if (cachedFontBytes) return cachedFontBytes;

  const envPath = process.env.CJK_FONT_PATH?.trim();
  const localPath = path.join(process.cwd(), "fonts", "NotoSansSC-Regular.otf");

  for (const p of [envPath, localPath].filter(Boolean) as string[]) {
    try {
      if (fs.existsSync(p)) {
        const st = fs.statSync(p);
        if (st.size < 500_000) continue;
        cachedFontBytes = new Uint8Array(fs.readFileSync(p));
        return cachedFontBytes;
      }
    } catch {
      /* continue */
    }
  }

  cachedFontBytes = await fetchFontFromNetwork();
  return cachedFontBytes;
}

/**
 * 必须 subset: false。subset:true 在 fontkit + 思源/Noto CJK 上经常只嵌入数字等少量字形，
 * 导致中文表头/姓名不显示或乱码。
 */
async function embedCjkFont(pdf: PDFDocument, fontBytes: Uint8Array): Promise<PDFFont> {
  return pdf.embedFont(fontBytes, { subset: false });
}

/** 按 Unicode 码点截断，避免在中间劈开代理对导致乱码 */
function fitText(text: string, font: PDFFont, size: number, maxW: number): string {
  if (!text) return "";
  if (font.widthOfTextAtSize(text, size) <= maxW) return text;
  const ell = "…";
  const chars = [...text];
  while (chars.length > 0 && font.widthOfTextAtSize(chars.join("") + ell, size) > maxW) {
    chars.pop();
  }
  return chars.length === 0 ? ell : chars.join("") + ell;
}

function drawVerticals(
  page: PDFPage,
  boundaries: number[],
  yBottom: number,
  yTop: number,
  color: ReturnType<typeof rgb>,
  thickness: number,
) {
  for (const x of boundaries) {
    page.drawLine({
      start: { x, y: yBottom },
      end: { x, y: yTop },
      thickness,
      color,
    });
  }
}

/**
 * A4 横向：表头灰底、网格、分页重复表头；中文为完整嵌入 Noto Sans SC（PDF 体积较大）
 */
export async function buildAttendancePdfZh(rows: ExportRowZh[], yearMonth: string): Promise<Uint8Array> {
  const fontBytes = await loadCjkFontBytes();
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const font = await embedCjkFont(pdf, fontBytes);

  const W = 842.28;
  const H = 595.28;
  const M = 32;
  const headerFill = rgb(0.92, 0.93, 0.95);
  const gridColor = rgb(0.72, 0.74, 0.78);
  const textColor = rgb(0.12, 0.14, 0.18);

  const titleSize = 11;
  const headerSize = 7.5;
  const bodySize = 7;
  const title = `考勤明细 · ${yearMonth} · 共 ${rows.length} 条`;
  const rowH = 16;
  const headerH = 20;

  const colWidths = [...PDF_COL_WIDTHS];
  const sumW = colWidths.reduce((a, b) => a + b, 0);
  const tableW = Math.min(sumW, W - 2 * M);
  const scale = tableW / sumW;
  const scaledWidths = colWidths.map((w) => w * scale);

  const colLeft: number[] = [];
  let acc = M;
  for (const cw of scaledWidths) {
    colLeft.push(acc);
    acc += cw;
  }
  const boundaries = [...colLeft, M + tableW];

  const drawHeader = (page: PDFPage, headerTop: number): number => {
    const headerBottom = headerTop - headerH;
    page.drawRectangle({
      x: M,
      y: headerBottom,
      width: tableW,
      height: headerH,
      color: headerFill,
      borderColor: gridColor,
      borderWidth: 0.55,
    });

    EXPORT_HEADERS_ZH.forEach((label, i) => {
      const x = colLeft[i]! + 3;
      const maxW = scaledWidths[i]! - 6;
      const t = fitText(label, font, headerSize, maxW);
      page.drawText(t, {
        x,
        y: headerBottom + (headerH - headerSize) / 2 - 1,
        size: headerSize,
        font,
        color: textColor,
      });
    });

    drawVerticals(page, boundaries, headerBottom, headerTop, gridColor, 0.55);
    return headerBottom;
  };

  const drawDataRow = (page: PDFPage, cells: string[], rowTop: number): number => {
    const rowBottom = rowTop - rowH;
    page.drawRectangle({
      x: M,
      y: rowBottom,
      width: tableW,
      height: rowH,
      borderColor: gridColor,
      borderWidth: 0.45,
    });

    cells.forEach((cell, i) => {
      const x = colLeft[i]! + 3;
      const maxW = scaledWidths[i]! - 6;
      const t = fitText(cell, font, bodySize, maxW);
      page.drawText(t, {
        x,
        y: rowBottom + (rowH - bodySize) / 2 - 1.5,
        size: bodySize,
        font,
        color: textColor,
      });
    });

    drawVerticals(page, boundaries, rowBottom, rowTop, gridColor, 0.45);
    return rowBottom;
  };

  const minY = M + 12;
  let page = pdf.addPage([W, H]);
  let headerTop = H - M;

  page.drawText(title, {
    x: M,
    y: headerTop - titleSize,
    size: titleSize,
    font,
    color: textColor,
  });
  headerTop -= titleSize + 18;

  let rowTop = drawHeader(page, headerTop);

  for (const row of rows) {
    const cells = rowZhToArray(row);
    if (rowTop - rowH < minY) {
      page = pdf.addPage([W, H]);
      headerTop = H - M;
      rowTop = drawHeader(page, headerTop);
    }
    rowTop = drawDataRow(page, cells, rowTop);
  }

  return pdf.save();
}
