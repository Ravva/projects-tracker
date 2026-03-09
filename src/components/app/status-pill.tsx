import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Tone = "critical" | "warning" | "success" | "calm";

export function StatusPill({ label, tone }: { label: string; tone: Tone }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-transparent px-2.5 py-1 text-[11px] tracking-[0.16em] uppercase",
        tone === "critical" &&
          "bg-[hsl(var(--status-critical)/0.14)] text-[hsl(var(--status-critical))]",
        tone === "warning" &&
          "bg-[hsl(var(--status-warning)/0.16)] text-[hsl(var(--status-warning))]",
        tone === "success" &&
          "bg-[hsl(var(--status-success)/0.14)] text-[hsl(var(--status-success))]",
        tone === "calm" &&
          "bg-[hsl(var(--status-calm)/0.14)] text-[hsl(var(--status-calm))]",
      )}
    >
      {label}
    </Badge>
  );
}
