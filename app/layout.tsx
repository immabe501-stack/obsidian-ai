import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "員工特休系統",
  description: "Employee leave management system",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
