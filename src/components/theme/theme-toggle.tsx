"use client";

import {
  ComputerIcon,
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
  const { theme, setTheme } = useTheme();

  const getThemeDetails = () => {
    switch (theme) {
      case "amethyst-eclipse":
        return { icon: MoonEclipseIcon, label: "Аметист" };
      case "system":
        return { icon: ComputerIcon, label: "Система" };
      case "cyber-emerald":
      default:
        return { icon: Leaf01Icon, label: "Изумруд" };
    }
  };

  const { icon, label } = getThemeDetails();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          title="Сменить тему"
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:bg-white/10 hover:text-foreground cursor-pointer focus:outline-hidden"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <HugeiconsIcon icon={icon} size={13} strokeWidth={2} />
          <span className="hidden sm:inline">{label}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[170px]">
        <DropdownMenuItem onClick={() => setTheme("cyber-emerald")}>
          <HugeiconsIcon icon={Leaf01Icon} strokeWidth={2} />
          <span>Кибер-изумруд</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("amethyst-eclipse")}>
          <HugeiconsIcon icon={MoonEclipseIcon} strokeWidth={2} />
          <span>Сумеречный аметист</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <HugeiconsIcon icon={ComputerIcon} strokeWidth={2} />
          <span>Системная</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
