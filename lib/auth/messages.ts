export function authErrorMessage(message: string): string {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("invalid login credentials") ||
    normalized.includes("invalid email or password")
  ) {
    return "電郵或密碼不正確。";
  }

  if (normalized.includes("email not confirmed")) {
    return "請先到電郵確認帳號，然後再登入。";
  }

  if (normalized.includes("user already registered") || normalized.includes("already been registered")) {
    return "這個電郵已經註冊。請直接登入。";
  }

  if (normalized.includes("rate limit") || normalized.includes("too many")) {
    return "嘗試次數太多，請稍後再試。";
  }

  if (normalized.includes("password")) {
    return "密碼未符合要求。請使用至少 8 個字元。";
  }

  if (normalized.includes("unable to validate email")) {
    return "電郵格式不正確。";
  }

  return "操作未完成，請再試一次。";
}

export function callbackErrorMessage(code: string | undefined): string | null {
  if (code === "callback") {
    return "登入未完成，請再試一次。";
  }

  return null;
}
