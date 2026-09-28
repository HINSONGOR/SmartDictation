export const THEMES = [
  { id: "default", label: "預設" },
  { id: "blue", label: "藍色" },
  { id: "green", label: "綠色" },
  { id: "purple", label: "紫色" },
  { id: "pink", label: "粉色" },
  { id: "dark", label: "深色" },
  { id: "cartoon", label: "卡通" },
] as const;

export type ThemeName = (typeof THEMES)[number]["id"];

export const THEME_STORAGE_KEY = "smartdictation.theme";

export function isTheme(value: unknown): value is ThemeName {
  return typeof value === "string" && THEMES.some((theme) => theme.id === value);
}

export function themeLabel(theme: ThemeName): string {
  return THEMES.find((item) => item.id === theme)?.label ?? "預設";
}

const themeIds = THEMES.map((theme) => theme.id);

export const themeBootScript = `(function(){try{var allowed=${JSON.stringify(themeIds)};var root=document.documentElement;if(root.getAttribute("data-theme-saved")==="true")return;var stored=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(allowed.indexOf(stored)>=0)root.setAttribute("data-theme",stored);}catch(e){}})();`;
