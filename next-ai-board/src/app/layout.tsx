import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/SiteHeader";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Board",
  description: "AI 기능을 붙여가는 Next.js 게시판 프로젝트",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
