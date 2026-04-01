import type { CapacitorConfig } from "@capacitor/cli";

/**
 * 封装模式：
 * - 生产：将 CAP_SERVER_URL 指向已部署的 HTTPS 地址（推荐）
 * - 开发：可指向局域网开发地址，例如 http://192.168.1.11:3001
 */
const serverUrl = process.env.CAP_SERVER_URL?.trim();

const config: CapacitorConfig = {
  appId: "com.company.attendance",
  appName: "考勤填报",
  webDir: ".next",
  server: serverUrl
    ? {
        url: serverUrl,
        cleartext: serverUrl.startsWith("http://"),
      }
    : undefined,
};

export default config;
