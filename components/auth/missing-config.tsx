export function MissingConfig() {
  return (
    <div className="grid gap-3 text-base leading-7 text-foreground">
      <p>尚未設定 Supabase，登入暫時不能使用。</p>
      <p>在專案根目錄建立 `.env.local`，填入這兩個變數：</p>
      <ul className="list-disc pl-5">
        <li>
          <code>NEXT_PUBLIC_SUPABASE_URL</code>
        </li>
        <li>
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
        </li>
      </ul>
      <p>
        然後在 Supabase SQL Editor 執行{" "}
        <code>supabase/migrations/20260928120000_stage1_auth.sql</code>
        ，並重啟開發伺服器。
      </p>
    </div>
  );
}
