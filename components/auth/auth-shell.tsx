import type { ReactNode } from "react";

type AuthShellProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function AuthShell({ title, description, children }: AuthShellProps) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
      <p className="text-sm font-medium text-muted">SmartDictation</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
      {description ? <p className="mt-2 text-base leading-7 text-muted">{description}</p> : null}
      <div className="mt-8 rounded-2xl border border-border bg-card p-5">{children}</div>
    </main>
  );
}
