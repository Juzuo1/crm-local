import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "YIMU 客户管理系统",
  description: "YIMU Energy 外贸客户管理系统",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
