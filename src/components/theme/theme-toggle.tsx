"use client";

import { Check, Monitor, Moon, Palette, Sun } from "lucide-react";
import { type ThemeMode, useTheme } from "@/components/theme/theme-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
  const { theme, setTheme, mode, resolvedMode, setMode } = useTheme();

  const presets = [
    {
      id: "amethyst-eclipse",
      name: "Индиго (Lavender)",
      color: "bg-[#7F56D9] shadow-[#7F56D9]/50",
    },
    {
      id: "cyber-emerald",
      name: "Изумруд (Mint)",
      color: "bg-[#12B76A] shadow-[#12B76A]/50",
    },
    {
      id: "amber-core",
      name: "Янтарь (Honey)",
      color: "bg-[#F79009] shadow-[#F79009]/50",
    },
  ];

  const currentPreset = presets.find((p) => p.id === theme) || presets[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          title="Настройка оформления"
          className="inline-flex cursor-pointer items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold text-foreground transition-all duration-200 hover:bg-muted/70 active:scale-[0.98] focus:outline-hidden border border-border/80 bg-background/50 backdrop-blur-md shadow-xs shadow-[0_1px_2px_rgba(16,24,40,0.05)]"
        >
          <span
            aria-hidden="true"
            className={`size-2 rounded-full shadow-[0_0_10px_2px_currentColor] transition-all duration-300 ${currentPreset.color}`}
          />
          {resolvedMode === "dark" ? (
            <Moon className="size-3.5 text-foreground/80" strokeWidth={2.4} />
          ) : (
            <Sun className="size-3.5 text-foreground/80" strokeWidth={2.4} />
          )}
          <span className="hidden sm:inline font-mono tracking-wide text-[10px] uppercase text-muted-foreground">
            Untitled UI
          </span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-[260px] p-3 rounded-2xl glass border-border/80 dark:border-border/60"
      >
        <DropdownMenuLabel className="px-1 text-[10px] uppercase tracking-widest text-muted-foreground font-bold flex items-center gap-1.5 mb-2">
          <Sun className="size-3" />
          Режим отображения
        </DropdownMenuLabel>

        {/* Luxury segmented control tab container */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-muted/80 dark:bg-muted/40 rounded-xl mb-3 border border-border/20">
          <button
            type="button"
            onClick={() => setMode("light")}
            className={`flex flex-col items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-semibold transition-all duration-200 ${
              mode === "light"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sun className="size-3.5" />
            Светлый
          </button>
          <button
            type="button"
            onClick={() => setMode("dark")}
            className={`flex flex-col items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-semibold transition-all duration-200 ${
              mode === "dark"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Moon className="size-3.5" />
            Темный
          </button>
          <button
            type="button"
            onClick={() => setMode("system")}
            className={`flex flex-col items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-semibold transition-all duration-200 ${
              mode === "system"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Monitor className="size-3.5" />
            Система
          </button>
        </div>

        <DropdownMenuSeparator className="bg-border/30 my-2" />

        <DropdownMenuLabel className="px-1 text-[10px] uppercase tracking-widest text-muted-foreground font-bold flex items-center gap-1.5 mb-2 mt-1">
          <Palette className="size-3" />
          Цветовая гамма
        </DropdownMenuLabel>

        {/* Brand Presets Selection */}
        <div className="flex flex-col gap-1">
          {presets.map((preset) => {
            const isSelected = theme === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => setTheme(preset.id as ThemeMode)}
                className={`flex items-center justify-between px-2.5 py-2 rounded-xl text-left text-xs font-semibold w-full transition-all duration-200 hover:bg-muted/60 ${
                  isSelected
                    ? "bg-primary/10 text-primary"
                    : "text-foreground/90"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`size-3 rounded-full transition-all ${preset.color}`}
                  />
                  <span>{preset.name}</span>
                </div>
                {isSelected && (
                  <Check className="size-3.5 text-primary" strokeWidth={3} />
                )}
              </button>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
