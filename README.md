# SmartDictation

家庭用中英文默書。第一階段是登入。

## 本地啟動

1. 在 Supabase 建立專案，開啟 Email 和 Google 登入。
2. Authentication → URL Configuration：
   - Site URL：`http://localhost:3000`
   - Redirect URLs：`http://localhost:3000/**`
3. 在 SQL Editor 執行 `supabase/migrations/20260928120000_stage1_auth.sql`。
4. 複製 `.env.example` 為 `.env.local`，填入 Project URL 和 anon key。
5. `npm run dev`，開啟 http://localhost:3000 。

Anon key 可以放在前端。不要把 service role key 放進 `.env.local` 或對話。
