import type { Metadata, Viewport } from "next";
import { ThemePicker } from "@/components/theme/ThemePicker";
import { loadSavedTheme } from "@/lib/theme/load";
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

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const savedTheme = await loadSavedTheme();

  return (
    <html
      lang="zh-HK"
      data-theme={savedTheme.theme}
      data-theme-saved={savedTheme.saved ? "true" : "false"}
      className="h-full"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="flex min-h-dvh flex-col bg-background text-foreground antialiased">
        <div className="mx-auto w-full max-w-3xl px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <ThemePicker initialTheme={savedTheme.theme} saved={savedTheme.saved} />
        </div>
        {children}
      </body>
    </html>
  );
}
