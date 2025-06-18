"use client";

import { useTheme } from "next-themes";
import { Monitor, Sun, Moon } from "lucide-react";
import showToast from "@/lib/toast";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const themes = [
    { id: "system", label: "System", icon: Monitor, emoji: "🖥️" },
    { id: "light", label: "Light", icon: Sun, emoji: "☀️" },
    { id: "dark", label: "Dark", icon: Moon, emoji: "🌙" },
  ];

  const getCurrentThemeIndex = () => {
    const index = themes.findIndex((t) => t.id === theme);
    return index >= 0 ? index : 0; // Default to system if theme not found
  };

  const handleToggle = () => {
    const currentIndex = getCurrentThemeIndex();
    const nextIndex = (currentIndex + 1) % themes.length;
    const nextTheme = themes[nextIndex];

    setTheme(nextTheme.id);
    showToast.custom(
      `Switched to ${nextTheme.label.toLowerCase()} mode`,
      nextTheme.emoji,
    );
  };

  const currentTheme = themes[getCurrentThemeIndex()];
  const Icon = currentTheme.icon;

  return (
    <button
      onClick={handleToggle}
      className="bg-muted/80 hover:bg-muted border border-border shadow-lg rounded-full p-1.5 transition-colors duration-200"
      aria-label={`Switch to ${currentTheme.label} theme`}
    >
      <Icon className="h-4 w-4 text-foreground" />
    </button>
  );
}
