"use client";

import { Button } from "@/components/ui/button";

export function PrintReportButton() {
  return (
    <Button
      type="button"
      variant="outline"
      className="rounded-xl bg-background/90 print:hidden"
      onClick={() => window.print()}
    >
      Печать / Сохранить PDF
    </Button>
  );
}
