const requests = new Map<string, number[]>();

export function allowTtsRequest(userId: string, limit = 40, windowMs = 60_000): boolean {
  const now = Date.now();
  const recent = (requests.get(userId) ?? []).filter((timestamp) => now - timestamp < windowMs);
  if (recent.length >= limit) {
    requests.set(userId, recent);
    return false;
  }

  recent.push(now);
  requests.set(userId, recent);
  return true;
}
