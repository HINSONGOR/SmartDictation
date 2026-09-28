"use client";

import { useEffect, useState } from "react";
import { saveTheme } from "@/lib/theme/actions";
import { isTheme, THEME_STORAGE_KEY, THEMES, themeLabel, type ThemeName } from "@/lib/theme/themes";

export function ThemePicker({ initialTheme, saved }: { initialTheme: ThemeName; saved: boolean }) {
  const [theme, setTheme] = useState<ThemeName>(initialTheme);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    if (!isTheme(current)) {
      return;
    }

    setTheme(current);
    if (!saved && current !== initialTheme) {
      void saveTheme(current);
    }
  }, [initialTheme, saved]);

  function choose(next: ThemeName) {
    document.documentElement.dataset.theme = next;
    document.documentElement.dataset.themeSaved = "true";
    window.localStorage.setItem(THEME_STORAGE_KEY, next);
    setTheme(next);
    setError(null);
    void saveTheme(next).then((result) => {
      if (result.error) {
        setError(result.error);
      }
    });
  }

  return (
    <details className="rounded-2xl border border-border bg-card px-4">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 text-base font-medium text-foreground">
        <span>主題：{themeLabel(theme)}</span>
        <span className="theme-swatch" data-swatch={theme} aria-hidden="true" />
      </summary>
      <fieldset className="grid gap-2 pb-4">
        <legend className="sr-only">介面主題</legend>
        {THEMES.map((item) => (
          <label
            key={item.id}
            className={`flex min-h-12 items-center gap-3 rounded-xl border px-3 text-base text-foreground ${
              theme === item.id ? "border-primary bg-secondary" : "border-border bg-background"
            }`}
          >
            <input
              className="size-5"
              type="radio"
              name="theme"
              value={item.id}
              checked={theme === item.id}
              onChange={() => choose(item.id)}
            />
            <span className="theme-swatch" data-swatch={item.id} aria-hidden="true" />
            {item.label}
          </label>
        ))}
      </fieldset>
      {error ? (
        <p role="alert" className="pb-4 text-base text-error">
          {error}
        </p>
      ) : null}
    </details>
  );
}
