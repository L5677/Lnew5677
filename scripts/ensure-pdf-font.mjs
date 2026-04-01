#!/usr/bin/env node
/**
 * 安装依赖或手动执行：npm run pdf-font
 * 将 Noto Sans SC（简体子集）下载到 fonts/，避免运行时在线拉取失败。
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const dest = path.join(root, "fonts", "NotoSansSC-Regular.otf");
const MIN_BYTES = 1_000_000;

const URLS = [
  "https://cdn.jsdelivr.net/gh/notofonts/noto-cjk@main/Sans/SubsetOTF/SC/NotoSansSC-Regular.otf",
  "https://fastly.jsdelivr.net/gh/notofonts/noto-cjk@main/Sans/SubsetOTF/SC/NotoSansSC-Regular.otf",
  "https://raw.githubusercontent.com/notofonts/noto-cjk/main/Sans/SubsetOTF/SC/NotoSansSC-Regular.otf",
];

async function tryFetch(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 180000);
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: ctrl.signal,
      headers: { "User-Agent": "attendance-report-font-setup/1.0" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < MIN_BYTES) throw new Error(`文件过小(${buf.length})`);
    return buf;
  } finally {
    clearTimeout(t);
  }
}

async function main() {
  if (fs.existsSync(dest) && fs.statSync(dest).size >= MIN_BYTES) {
    console.log("[pdf-font] 已存在，跳过:", dest);
    return;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });

  let lastErr = "";
  for (const url of URLS) {
    try {
      console.log("[pdf-font] 正在下载…", url);
      const buf = await tryFetch(url);
      fs.writeFileSync(dest, buf);
      console.log("[pdf-font] 已保存", dest, `(${buf.length} 字节)`);
      return;
    } catch (e) {
      lastErr = String(e?.message || e);
      console.warn("[pdf-font] 失败:", lastErr);
    }
  }
  console.warn(
    "[pdf-font] 所有镜像均失败，请手动下载 NotoSansSC-Regular.otf 到 fonts/ 目录\n  源文件: https://github.com/notofonts/noto-cjk/tree/main/Sans/SubsetOTF/SC",
  );
  process.exitCode = 0;
}

main();
