"use client";

import { Button } from "@/components/ui/button";

export function PrintReportButton({ label }: { label: string }) {
  return (
    <Button
      type="button"
      variant="outline"
      className="rounded-xl bg-background/90 print:hidden"
      onClick={() => window.print()}
    >
      {label}
    </Button>
  );
}
