export function isMissingSchema(code: string | undefined): boolean {
  return code === "42P01" || code === "PGRST205" || code === "PGRST204" || code === "PGRST202";
}
