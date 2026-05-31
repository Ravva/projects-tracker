"use client";

import {
  ComputerIcon,
  FireIcon,
  Leaf01Icon,
  MoonEclipseIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTheme } from "@/components/theme/theme-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
  const { resolvedTheme, theme, setTheme } = useTheme();

  const getThemeDetails = () => {
    switch (resolvedTheme) {
      case "amethyst-eclipse":
        return {
          icon: MoonEclipseIcon,
          label: theme === "system" ? "Система: аметист" : "Аметист",
          swatchClassName: "bg-fuchsia-400",
        };
      case "amber-core":
        return {
          icon: FireIcon,
          label: theme === "system" ? "Система: янтарь" : "Янтарь",
          swatchClassName: "bg-amber-500",
        };
      default:
        return {
          icon: Leaf01Icon,
          label: theme === "system" ? "Система: изумруд" : "Изумруд",
          swatchClassName: "bg-cyan-400",
        };
    }
  };

  const { icon, label, swatchClassName } = getThemeDetails();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          title="Сменить тему"
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium text-foreground transition-all hover:bg-white/10 focus:outline-hidden"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <span
            aria-hidden="true"
            className={`size-1.5 rounded-full shadow-[0_0_10px_currentColor] ${swatchClassName}`}
          />
          <HugeiconsIcon icon={icon} size={13} strokeWidth={2} />
          <span className="hidden sm:inline">{label}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[170px]">
        <DropdownMenuItem
          aria-current={theme === "cyber-emerald" ? "true" : undefined}
          className={theme === "cyber-emerald" ? "bg-accent" : undefined}
          onSelect={() => setTheme("cyber-emerald")}
        >
          <HugeiconsIcon icon={Leaf01Icon} strokeWidth={2} />
          <span>Кибер-изумруд</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          aria-current={theme === "amethyst-eclipse" ? "true" : undefined}
          className={theme === "amethyst-eclipse" ? "bg-accent" : undefined}
          onSelect={() => setTheme("amethyst-eclipse")}
        >
          <HugeiconsIcon icon={MoonEclipseIcon} strokeWidth={2} />
          <span>Сумеречный аметист</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          aria-current={theme === "amber-core" ? "true" : undefined}
          className={theme === "amber-core" ? "bg-accent" : undefined}
          onSelect={() => setTheme("amber-core")}
        >
          <HugeiconsIcon icon={FireIcon} strokeWidth={2} />
          <span>Янтарное ядро</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          aria-current={theme === "system" ? "true" : undefined}
          className={theme === "system" ? "bg-accent" : undefined}
          onSelect={() => setTheme("system")}
        >
          <HugeiconsIcon icon={ComputerIcon} strokeWidth={2} />
          <span>Системная</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
