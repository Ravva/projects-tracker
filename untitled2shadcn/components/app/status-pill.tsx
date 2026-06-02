type Tone = "critical" | "warning" | "success" | "calm";

const toneClasses: Record<Tone, string> = {
  critical:
    "bg-status-critical/8 text-status-critical border border-status-critical/20 dark:bg-status-critical/15 dark:border-status-critical/30",
  warning:
    "bg-status-warning/8 text-status-warning border border-status-warning/20 dark:bg-status-warning/15 dark:border-status-warning/30",
  success:
    "bg-status-success/8 text-status-success border border-status-success/20 dark:bg-status-success/15 dark:border-status-success/30",
  calm: "bg-status-calm/8 text-status-calm border border-status-calm/25 dark:bg-status-calm/15 dark:border-status-calm/35",
};

const dotClasses: Record<Tone, string> = {
  critical: "bg-status-critical",
  warning: "bg-status-warning",
  success: "bg-status-success",
  calm: "bg-status-calm",
};

export function StatusPill({ label, tone }: { label: string; tone: Tone }) {
  return (
    <span
      className={`inline-flex h-6 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium transition-all duration-300 border ${toneClasses[tone]}`}
    >
      <span className={`size-1.5 rounded-full shrink-0 ${dotClasses[tone]}`} />
      {label}
    </span>
  );
}
