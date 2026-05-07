type Tone = "critical" | "warning" | "success" | "calm";

const toneStyles: Record<
  Tone,
  { background: string; border: string; color: string }
> = {
  critical: {
    background: "rgba(239,68,68,0.12)",
    border: "1px solid rgba(239,68,68,0.3)",
    color: "hsl(var(--status-critical))",
  },
  warning: {
    background: "rgba(245,158,11,0.12)",
    border: "1px solid rgba(245,158,11,0.3)",
    color: "hsl(var(--status-warning))",
  },
  success: {
    background: "rgba(34,197,94,0.12)",
    border: "1px solid rgba(34,197,94,0.3)",
    color: "hsl(var(--status-success))",
  },
  calm: {
    background: "rgba(6,182,212,0.12)",
    border: "1px solid rgba(6,182,212,0.3)",
    color: "hsl(var(--status-calm))",
  },
};

export function StatusPill({ label, tone }: { label: string; tone: Tone }) {
  const styles = toneStyles[tone];
  return (
    <span
      className="inline-flex h-5 items-center justify-center whitespace-nowrap rounded-full px-2.5 text-[11px] font-medium leading-none uppercase tracking-[0.12em]"
      style={{
        background: styles.background,
        border: styles.border,
        color: styles.color,
      }}
    >
      {label}
    </span>
  );
}
