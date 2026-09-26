"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

const THEMES = ["light", "dark", "system"] as const;

export function ModeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  function cycleTheme() {
    const current = theme ?? "system";
    const nextIndex = (THEMES.indexOf(current as (typeof THEMES)[number]) + 1) % THEMES.length;
    setTheme(THEMES[nextIndex]);
  }

  if (!mounted) {
    return <Button variant="ghost" size="icon" aria-label="Toggle theme" disabled />;
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycleTheme}
      aria-label={`Theme: ${theme ?? "system"}. Click to change.`}
      title={`Theme: ${theme ?? "system"}`}
    >
      {theme === "light" ? (
        <Sun className="size-4" />
      ) : theme === "dark" ? (
        <Moon className="size-4" />
      ) : (
        <span className="relative flex size-4 items-center justify-center">
          <Sun className="size-4 dark:hidden" />
          <Moon className="hidden size-4 dark:block" />
        </span>
      )}
    </Button>
  );
}
