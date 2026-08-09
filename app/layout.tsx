import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Layout Lab — 업무 시스템 레이아웃 에디터",
  description: "메뉴와 페이지, 업무 요소를 직접 배치하고 로컬에 저장하는 사내 웹 서비스 설계 도구",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
