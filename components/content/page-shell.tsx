import Link from "next/link";
import type { ReactNode } from "react";

type PageShellProps = {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  children: ReactNode;
};

export function PageShell({ title, description, backHref, backLabel = "返回", children }: PageShellProps) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
      {backHref ? (
        <Link href={backHref} className="inline-flex min-h-12 items-center text-base font-medium text-primary">
          {backLabel}
        </Link>
      ) : (
        <p className="text-sm font-medium text-muted">SmartDictation</p>
      )}
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
      {description ? <p className="mt-2 text-base leading-7 text-muted">{description}</p> : null}
      <div className="mt-6 grid gap-4">{children}</div>
    </main>
  );
}

export function HubLink({ href, title, detail }: { href: string; title: string; detail: string }) {
  return (
    <Link href={href} className="rounded-2xl border border-border bg-card p-5">
      <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
      <p className="mt-2 text-base text-muted">{detail}</p>
      <span className="mt-4 inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-5 text-base font-medium text-primary-foreground">
        開啟
      </span>
    </Link>
  );
}

export function MigrationNotice() {
  return (
    <p className="rounded-2xl border border-border bg-card p-5 text-base leading-7 text-foreground">
      資料表尚未建立。請在 Supabase SQL Editor 貼上並執行{" "}
      <code>supabase/migrations/20260928140000_stage2_content.sql</code> 的內容，不要只貼檔案路徑。
    </p>
  );
}
