"use client";

import { useEffect } from "react";

interface ScrollToElementProps {
  elementId: string;
}

export function ScrollToElement({ elementId }: ScrollToElementProps) {
  useEffect(() => {
    const element = document.getElementById(elementId);

    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [elementId]);

  return null;
}
