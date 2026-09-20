"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, X } from "lucide-react";

export function AnnouncementBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <aside
      aria-label="Announcement"
      className="relative z-50 border-b border-border bg-muted/50 px-4 py-2.5 text-sm text-foreground"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex w-full items-center justify-center gap-3 text-center">
          <span className="inline-flex items-center rounded bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-bold text-primary border border-primary/20">
            v1.0
          </span>
          <p className="truncate text-muted-foreground text-sm">
            <span className="font-semibold text-foreground">CostGate FinOps Guard:</span>{" "}
            Catch database cost spikes before code merges.
          </p>
          <Link
            href="/demo"
            className="inline-flex items-center gap-1 font-medium text-foreground hover:text-primary transition-colors ml-2 group text-sm"
          >
            <span>Try PR Studio</span>
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted transition-colors hidden sm:block"
          aria-label="Dismiss announcement"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </aside>
  );
}
