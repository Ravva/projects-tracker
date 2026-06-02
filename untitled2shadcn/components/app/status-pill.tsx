type Tone = "critical" | "warning" | "success" | "calm";

const toneClasses: Record<Tone, string> = {
  critical:
    "bg-status-critical/10 text-status-critical border border-status-critical/20",
  warning:
    "bg-status-warning/10 text-status-warning border border-status-warning/20",
  success:
    "bg-status-success/10 text-status-success border border-status-success/20",
  calm: "bg-status-calm/10 text-status-calm border border-status-calm/20",
};

export function StatusPill({ label, tone }: { label: string; tone: Tone }) {
  return (
    <span
      className={`inline-flex h-5.5 items-center justify-center whitespace-nowrap rounded-md px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${toneClasses[tone]}`}
    >
      {label}
    </span>
  );
}
