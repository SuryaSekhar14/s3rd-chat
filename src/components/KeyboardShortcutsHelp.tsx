import React from "react";
import { useOperatingSystem } from "@/hooks/useOperatingSystem";

export const KeyboardShortcutsHelp = () => {
  const os = useOperatingSystem();
  const isMac = os === "macos";
  const modKey = isMac ? "⌘" : "Ctrl";

  const shortcuts = [
    { key: `${modKey} + Enter`, action: "Send message" },
    { key: "Esc", action: "Stop generation" },
    { key: `${modKey} + Shift + Enter`, action: "New chat" },
    { key: `${modKey} + E`, action: "Enhance prompt" },
    { key: `${modKey} + B`, action: "Toggle sidebar" },
    { key: `${modKey} + H`, action: "Show keyboard shortcuts" },
  ];

  return (
    <div className="text-sm text-muted-foreground p-2">
      <h2 className="text-2xl font-bold mb-3 text-foreground">
        Keyboard Shortcuts
      </h2>
      <ul className="space-y-1">
        {shortcuts.map((shortcut, index) => (
          <li key={index} className="flex justify-between">
            <span>{shortcut.action}</span>
            <kbd className="px-2 py-0.5 rounded bg-muted text-xs">
              {shortcut.key}
            </kbd>
          </li>
        ))}
      </ul>
    </div>
  );
};
