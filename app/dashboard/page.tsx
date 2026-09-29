import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";
import { MigrationNotice } from "@/components/content/page-shell";
import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { isMissingSchema } from "@/lib/supabase/errors";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type DashboardPageProps = {
  searchParams: Promise<{ password?: string | string[] }>;
};

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  if (!getSupabasePublicEnv()) {
    redirect("/login");
  }

  const params = await searchParams;
  const passwordSaved = firstParam(params.password) === "saved";
  const user = await requireUser();
  const supabase = await createClient();

  const [
    { data: profile, error: profileError },
    { data: students, error: studentsError },
    chineseLessons,
    englishLessons,
    chineseWords,
    englishWords,
  ] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
    supabase.from("students").select("id, name").order("created_at", { ascending: true }),
    supabase.from("lessons").select("id", { count: "exact", head: true }).eq("language", "zh"),
    supabase.from("lessons").select("id", { count: "exact", head: true }).eq("language", "en"),
    supabase.from("word_lists").select("id", { count: "exact", head: true }).eq("language", "zh"),
    supabase.from("word_lists").select("id", { count: "exact", head: true }).eq("language", "en"),
  ]);

  const accountMissing = isMissingSchema(profileError?.code) || isMissingSchema(studentsError?.code);
  const contentMissing =
    isMissingSchema(chineseLessons.error?.code) ||
    isMissingSchema(englishLessons.error?.code) ||
    isMissingSchema(chineseWords.error?.code) ||
    isMissingSchema(englishWords.error?.code);
  const displayName = profile?.display_name?.trim() || user.email || "帳號";

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
      <p className="text-sm font-medium text-muted">SmartDictation</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">主頁</h1>
      <p className="mt-3 text-base leading-7 text-muted">你好，{displayName}</p>
      {user.email ? <p className="text-base text-muted">{user.email}</p> : null}
      {passwordSaved ? (
        <p className="mt-4 rounded-2xl border border-border bg-card p-5 text-base leading-7 text-foreground">
          密碼已儲存。手機請用上面這個電郵，同剛設定的密碼登入。
        </p>
      ) : null}
      {students && students.length > 0 ? (
        <p className="text-base text-muted">學生：{students.map((student) => student.name).join("、")}</p>
      ) : null}

      {accountMissing ? (
        <p className="mt-8 rounded-2xl border border-border bg-card p-5 text-base leading-7 text-foreground">
          帳號資料表尚未建立。請執行 <code>supabase/migrations/20260928120000_stage1_auth.sql</code>。
        </p>
      ) : null}
      {contentMissing ? (
        <div className="mt-8">
          <MigrationNotice />
        </div>
      ) : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link href="/chinese" className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-2xl font-semibold text-foreground">中文默書</h2>
          <p className="mt-2 text-base text-muted">課文 / 詞語</p>
          <p className="mt-2 text-base text-foreground">
            {contentMissing
              ? "課文尚未就緒"
              : `${chineseLessons.count ?? 0} 篇課文，${chineseWords.count ?? 0} 個詞語表`}
          </p>
          <span className="mt-4 inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-5 text-base font-medium text-primary-foreground">
            開始
          </span>
        </Link>
        <Link href="/english" className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-2xl font-semibold text-foreground">English Dictation</h2>
          <p className="mt-2 text-base text-muted">課文 / Vocabulary</p>
          <p className="mt-2 text-base text-foreground">
            {contentMissing
              ? "課文尚未就緒"
              : `${englishLessons.count ?? 0} 篇課文，${englishWords.count ?? 0} 個生字表`}
          </p>
          <span className="mt-4 inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-5 text-base font-medium text-primary-foreground">
            開始
          </span>
        </Link>
      </div>

      <div className="mt-4">
        <Link href="/mistakes" className="block rounded-2xl border border-border bg-card p-5">
          <h2 className="text-2xl font-semibold text-foreground">錯題</h2>
          <p className="mt-2 text-base text-muted">重溫打字默書答錯的句子</p>
        </Link>
      </div>

      <div className="mt-6 max-w-lg">
        <LogoutButton />
      </div>
    </main>
  );
}
