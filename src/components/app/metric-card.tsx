import { HugeiconsIcon } from "@hugeicons/react";
import type { ComponentProps, ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type MetricTone = "critical" | "warning" | "calm" | "success";
type MetricIcon = ComponentProps<typeof HugeiconsIcon>["icon"];

const toneStyles: Record<MetricTone, string> = {
  critical:
    "border-l-[hsl(var(--status-critical))] bg-[hsl(var(--status-critical)/0.08)]",
  warning:
    "border-l-[hsl(var(--status-warning))] bg-[hsl(var(--status-warning)/0.08)]",
  calm: "border-l-[hsl(var(--status-calm))] bg-[hsl(var(--status-calm)/0.09)]",
  success:
    "border-l-[hsl(var(--status-success))] bg-[hsl(var(--status-success)/0.08)]",
};

export function MetricCard({
  title,
  value,
  description,
  tone,
  icon,
  progress,
  badge,
}: {
  title: string;
  value: string;
  description: string;
  tone: MetricTone;
  icon: MetricIcon;
  progress?: number;
  badge?: ReactNode;
}) {
  return (
    <Card
      className={cn(
        "border-border/70 border-l-4 shadow-none backdrop-blur-sm",
        toneStyles[tone],
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="space-y-1">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <div className="text-3xl font-semibold tracking-tight">{value}</div>
        </div>
        <div className="flex items-center gap-2">
          {badge}
          <div className="rounded-2xl border border-border/60 bg-background/80 p-2.5 text-foreground shadow-sm">
            <HugeiconsIcon icon={icon} size={18} strokeWidth={1.8} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        {typeof progress === "number" ? (
          <div className="space-y-2">
            <Progress value={progress} className="h-2.5 bg-background/70" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Текущий уровень контроля</span>
              <span>{progress}%</span>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function MetricBadge({
  label,
  tone,
}: {
  label: string;
  tone: MetricTone;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full border-transparent px-2.5 py-1 text-[11px] uppercase tracking-[0.16em]",
        tone === "critical" &&
          "bg-[hsl(var(--status-critical)/0.14)] text-[hsl(var(--status-critical))]",
        tone === "warning" &&
          "bg-[hsl(var(--status-warning)/0.16)] text-[hsl(var(--status-warning))]",
        tone === "calm" &&
          "bg-[hsl(var(--status-calm)/0.14)] text-[hsl(var(--status-calm))]",
        tone === "success" &&
          "bg-[hsl(var(--status-success)/0.14)] text-[hsl(var(--status-success))]",
      )}
    >
      {label}
    </Badge>
  );
}
