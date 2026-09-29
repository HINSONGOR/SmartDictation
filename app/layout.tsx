import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { themeBootScript } from "@/lib/theme/themes";
import "./globals.css";

export const metadata: Metadata = {
  title: "SmartDictation",
  description: "智能默書學習系統",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-HK" data-theme="default" data-theme-saved="false" className="h-full" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="flex min-h-dvh flex-col bg-background text-foreground antialiased">
        <div className="mx-auto flex w-full max-w-3xl justify-end px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <Link
            href="/settings"
            className="inline-flex min-h-12 items-center rounded-xl border border-border bg-card px-4 text-base font-medium text-foreground"
          >
            設定
          </Link>
        </div>
        {children}
      </body>
    </html>
  );
}
