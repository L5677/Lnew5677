import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "考勤填报系统",
  description: "公司内部考勤记录、汇总与导出",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
