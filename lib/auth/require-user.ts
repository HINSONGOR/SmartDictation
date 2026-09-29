import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { USER_HEADER } from "@/lib/auth/user-header";
import { createClient } from "@/lib/supabase/server";

const loadUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return null;
  }
  return data.user;
});

export async function requireUserId(): Promise<string> {
  const headerList = await headers();
  const headerId = headerList.get(USER_HEADER);
  if (headerId) {
    return headerId;
  }

  const user = await loadUser();
  if (!user) {
    redirect("/login");
  }
  return user.id;
}

export async function requireUser(): Promise<User> {
  const user = await loadUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}
