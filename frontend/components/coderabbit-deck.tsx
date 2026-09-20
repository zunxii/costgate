"use client";

import React, { useState, useEffect } from "react";
import { 
  Play, 
  Pause, 
  Sparkles, 
  AlertTriangle, 
  ArrowRight, 
  Database, 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TabItem {
  id: number;
  label: string;
  lead: string;
  remainder: string;
}

const TABS: TabItem[] = [
  { id: 1, label: "01", lead: "Review", remainder: "every PR automatically" },
  { id: 2, label: "02", lead: "Prioritize", remainder: "queries by cost impact" },
  { id: 3, label: "03", lead: "Understand", remainder: "execution plan blast radius" },
  { id: 4, label: "04", lead: "Guardrail", remainder: "your database spend continually" },
];

export function CodeRabbitDeck() {
  const [activeTab, setActiveTab] = useState(4); 
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = 50;
    const totalDuration = 6000;
    const increment = (interval / totalDuration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setActiveTab((cur) => (cur % 4) + 1);
          return 0;
        }
        return prev + increment;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [isPlaying, activeTab]);

  const handleTabClick = (tabId: number) => {
    setActiveTab(tabId);
    setProgress(0);
  };

  return (
    <div className="relative w-full max-w-6xl mx-auto mt-6">
      {/* Tab Navigation Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={cn(
                "group text-left px-4 py-3 rounded-md border transition-all duration-300 relative overflow-hidden",
                isActive
                  ? "bg-card border-primary/50 text-foreground shadow-sm"
                  : "bg-muted hover:bg-card border-border text-muted-foreground"
              )}
            >
              {/* Active Progress Line */}
              {isActive && (
                <div
                  className="absolute bottom-0 left-0 h-0.5 bg-primary transition-all duration-75"
                  style={{ width: `${progress}%` }}
                />
              )}

              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold">{tab.label}</span>
                <span className="font-semibold text-sm text-foreground">{tab.lead}</span>
              </div>
              <p className="text-[11px] truncate mt-0.5 font-medium">
                {tab.remainder}
              </p>
            </button>
          );
        })}
      </div>

      {/* The Visual Stage / Card Viewport */}
      <div className="relative rounded-lg border border-border bg-card overflow-hidden min-h-[480px]">
        
        {/* Card 01: Review */}
        {activeTab === 1 && (
          <div className="p-6 md:p-10 animate-in fade-in">
            <div className="max-w-3xl mx-auto rounded-lg border border-border bg-background overflow-hidden shadow-sm">
              <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <div className="size-6 rounded bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <Database className="size-3.5" />
                  </div>
                  <span className="font-bold text-sm text-foreground">costgate</span>
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground font-mono border border-border">bot</span>
                  <span className="text-xs text-muted-foreground">commented 2m ago</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-primary/10 border border-primary/20 text-primary text-[11px] px-2 py-0.5 font-mono font-bold">
                    ⚠️ +$1,240.50/mo
                  </span>
                  <span className="rounded bg-muted border border-border text-foreground text-[11px] px-2 py-0.5 font-mono font-medium">
                    High Confidence
                  </span>
                </div>
              </div>

              <div className="p-5 space-y-4 text-xs">
                <div className="flex items-center gap-2 text-destructive font-bold text-sm">
                  <AlertTriangle className="size-4 shrink-0" />
                  <span>Cost Regression Detected • Major</span>
                </div>
                <p className="text-foreground text-sm font-medium">
                  <strong>Wrapping customer_id in LOWER() breaks B-Tree index scan.</strong> Forces full table Seq Scan across 300,000 rows.
                </p>

                {/* Git diff hunk */}
                <div className="rounded border border-border bg-[#09090b] font-mono text-xs overflow-hidden text-slate-300">
                  <div className="bg-[#18181b] px-3 py-1.5 text-slate-400 text-[11px] border-b border-slate-800">
                    @@ -42,2 +42,3 @@ db/queries/customer_lookup.sql
                  </div>
                  <div className="p-3 space-y-1">
                    <div className="text-slate-400 px-2 py-0.5">
                      SELECT id, status, total_cents FROM orders
                    </div>
                    <div className="bg-red-950/50 text-red-400 px-2 py-0.5 rounded flex justify-between">
                      <span>- WHERE customer_id = 12345;</span>
                      <span className="font-sans text-[10px] text-red-500 font-medium">Index Scan (0.12ms)</span>
                    </div>
                    <div className="bg-amber-950/50 text-amber-400 px-2 py-0.5 rounded flex justify-between">
                      <span>+ WHERE LOWER(customer_id::text) = &apos;12345&apos;;</span>
                      <span className="font-sans text-[10px] text-amber-500 font-bold">Forces Seq Scan (16.8ms)</span>
                    </div>
                  </div>
                </div>

                {/* Committable suggestion */}
                <div className="rounded border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-700 flex items-center gap-1.5">
                      <Sparkles className="size-3.5" />
                      Committable Suggestion
                    </span>
                    <span className="text-[11px] font-bold text-emerald-700 font-mono">Saves ~$1,240/mo</span>
                  </div>
                  <div className="rounded bg-background p-2.5 font-mono text-emerald-800 border border-emerald-500/20 shadow-sm">
                    WHERE customer_id = 12345;
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Card 02: Prioritize */}
        {activeTab === 2 && (
          <div className="p-6 md:p-10 animate-in fade-in">
            <div className="max-w-4xl mx-auto rounded-lg border border-border bg-background overflow-hidden shadow-sm">
              <div className="border-b border-border bg-muted/50 px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                  <span>Pull Requests Priority Queue</span>
                  <span className="rounded bg-muted border border-border px-2 py-0.5 text-[10px] text-muted-foreground font-mono">128 PRs</span>
                </div>
                <span className="text-[11px] text-muted-foreground font-mono">Sorted by Cloud Cost Impact</span>
              </div>

              <div className="divide-y divide-border text-xs">
                <div className="p-4 flex items-center justify-between bg-destructive/5 hover:bg-destructive/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="rounded bg-destructive/10 text-destructive border border-destructive/20 px-2 py-0.5 font-bold font-mono text-[10px]">
                      P0
                    </span>
                    <div>
                      <div className="font-bold text-foreground">#42 feat(auth): customer_id lookup normalization</div>
                      <div className="text-muted-foreground text-[11px] mt-0.5 font-medium">300k rows Seq Scan • 135× slowdown</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-destructive text-sm">+$1,240.50/mo</div>
                    <div className="text-[10px] text-destructive font-semibold">Critical Regression</div>
                  </div>
                </div>

                <div className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="rounded bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 font-bold font-mono text-[10px]">
                      P1
                    </span>
                    <div>
                      <div className="font-bold text-foreground">#48 fix(billing): aggregate order_items summary</div>
                      <div className="text-muted-foreground text-[11px] mt-0.5 font-medium">900k rows • shared buffer memory spike</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-primary text-sm">+$182.00/mo</div>
                    <div className="text-[10px] text-muted-foreground font-medium">Medium Impact</div>
                  </div>
                </div>

                <div className="p-4 flex items-center justify-between bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="rounded bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 px-2 py-0.5 font-bold font-mono text-[10px]">
                      SAVING
                    </span>
                    <div>
                      <div className="font-bold text-foreground">#55 perf(orders): add index on orders(customer_id)</div>
                      <div className="text-muted-foreground text-[11px] mt-0.5 font-medium">Switches Seq Scan to B-Tree Index Seek</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-emerald-700 text-sm">-$1,240.50/mo</div>
                    <div className="text-[10px] text-emerald-700 font-semibold">Verified Reduction</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Card 03: Understand */}
        {activeTab === 3 && (
          <div className="p-6 md:p-10 animate-in fade-in">
            <div className="max-w-4xl mx-auto rounded-lg border border-border bg-background p-6 space-y-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="rounded bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 text-[11px] font-mono font-bold">
                    PR #42 Analysis
                  </span>
                  <span className="text-sm font-bold text-foreground">PostgreSQL Execution Plan AST</span>
                </div>
                <span className="text-[11px] font-mono text-muted-foreground font-medium">Total runtime: 16.825 ms</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded bg-muted p-4 border border-border">
                  <div className="text-[11px] font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Execution Ratio</div>
                  <div className="text-2xl font-black text-destructive font-mono">135.6×</div>
                  <div className="text-[11px] text-muted-foreground mt-1 font-medium">Slower than baseline</div>
                </div>

                <div className="rounded bg-muted p-4 border border-border">
                  <div className="text-[11px] font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Buffer Displacement</div>
                  <div className="text-2xl font-black text-destructive font-mono">+2,491</div>
                  <div className="text-[11px] text-muted-foreground mt-1 font-medium">Blocks evicted from cache</div>
                </div>

                <div className="rounded bg-muted p-4 border border-border">
                  <div className="text-[11px] font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Row Scan Waste</div>
                  <div className="text-2xl font-black text-foreground font-mono">299,994</div>
                  <div className="text-[11px] text-muted-foreground mt-1 font-medium">Rows removed by filter</div>
                </div>
              </div>

              <div className="rounded bg-[#09090b] p-4 font-mono text-[11px] space-y-1 text-slate-300 border border-slate-800">
                <div className="text-slate-500">// Execution Plan Tree</div>
                <div>-&gt; Gather (cost=1000.00..5706.58 rows=7 width=35) (actual time=1.386..16.825)</div>
                <div className="pl-4 text-amber-400">-&gt; Parallel Seq Scan on orders (cost=0.00..4705.88 rows=4)</div>
                <div className="pl-8 text-slate-400">Filter: (lower((customer_id)::text) = &apos;12345&apos;::text)</div>
                <div className="pl-8 text-cyan-400">Buffers: shared hit=2500</div>
              </div>
            </div>
          </div>
        )}

        {/* Card 04: Guardrail */}
        {activeTab === 4 && (
          <div className="p-6 md:p-10 animate-in fade-in relative">
            {/* Header Area */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-bold mb-1">
                  REAL-TIME CLOUD COST HEALTH
                </p>
                <div className="flex items-center gap-3">
                  <h3 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                    Mostly healthy
                  </h3>
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-semibold">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    <span>Scanning every PR • Last scan now • 0 critical</span>
                  </div>
                </div>
              </div>

              {/* Progress health bar */}
              <div className="w-full sm:w-72">
                <div className="h-2 rounded bg-muted overflow-hidden flex border border-border">
                  <div className="bg-emerald-500 h-full w-[85%]" />
                  <div className="bg-primary h-full w-[12%]" />
                  <div className="bg-destructive h-full w-[3%]" />
                </div>
              </div>
            </div>

            {/* Matrix Canvas */}
            <div className="relative rounded-lg border border-border bg-background p-6 min-h-[380px] overflow-hidden">

              {/* Dot Matrix Grid */}
              <div className="grid grid-cols-12 sm:grid-cols-24 gap-4">
                {Array.from({ length: 96 }).map((_, i) => {
                  let color = "bg-muted-foreground/30";
                  if (i === 42 || i === 73) color = "bg-destructive";
                  else if (i === 18 || i === 55 || i === 82) color = "bg-primary";
                  else if (i % 2 === 0) color = "bg-emerald-500/60";
                  return (
                    <span
                      key={i}
                      className={`size-1.5 rounded-sm ${color} transition-all hover:scale-150 cursor-pointer`}
                    />
                  );
                })}
              </div>

              {/* Floating Tooltip Card */}
              <div className="absolute top-16 left-8 sm:left-24 rounded-lg bg-background border border-primary/30 p-4 shadow-sm max-w-xs space-y-2 z-20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-[11px] text-foreground">
                    <span className="size-2 rounded bg-primary" />
                    <span>Cost Regression Alert</span>
                  </div>
                  <span className="rounded bg-primary/10 text-primary text-[9px] px-1.5 py-0.5 font-mono font-bold border border-primary/20">
                    High
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground font-mono">
                  orders • customer_id text cast
                </div>
                <div className="text-[10px] text-primary font-semibold">
                  Detected on PR #42 • +$1,240/mo impact
                </div>
                <div className="pt-2 border-t border-border flex items-center justify-between text-[10px] font-medium">
                  <span className="text-muted-foreground">Recommendation</span>
                  <span className="text-primary font-bold cursor-pointer hover:underline flex items-center gap-1">
                    <span>Fix ready</span>
                    <ArrowRight className="size-3" />
                  </span>
                </div>
              </div>

              {/* Floating Donut Chart Card */}
              <div className="absolute top-10 right-6 sm:right-12 rounded-lg bg-background border border-border p-5 shadow-sm max-w-[14rem] space-y-3 z-20 hidden md:block">
                <div>
                  <h4 className="text-[11px] font-bold text-foreground uppercase tracking-wider">Severity dist</h4>
                  <p className="text-[9px] text-muted-foreground font-mono">PostgreSQL EXPLAIN</p>
                </div>

                {/* SVG Donut Chart */}
                <div className="flex items-center justify-center relative my-4">
                  <svg className="size-24 -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-muted"
                      strokeWidth="4"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-emerald-500"
                      strokeDasharray="46, 100"
                      strokeWidth="4"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-muted-foreground/30"
                      strokeDasharray="40, 100"
                      strokeDashoffset="-46"
                      strokeWidth="4"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-primary"
                      strokeDasharray="12, 100"
                      strokeDashoffset="-86"
                      strokeWidth="4"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-destructive"
                      strokeDasharray="2, 100"
                      strokeDashoffset="-98"
                      strokeWidth="4"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="font-mono text-[11px] font-bold text-foreground">1,999</span>
                    <span className="text-[8px] text-muted-foreground uppercase font-mono">Findings</span>
                  </div>
                </div>

                {/* Legend */}
                <div className="grid grid-cols-2 gap-2 text-[9px] text-foreground font-medium">
                  <div className="flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-destructive" />
                    <span>Critical</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-primary" />
                    <span>High</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-muted-foreground/50" />
                    <span>Neutral</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    <span>Healthy</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Play/Pause Auto-rotation Toggle */}
        <div className="absolute bottom-4 right-4 z-30">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="size-7 rounded bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shadow-sm"
            aria-label={isPlaying ? "Pause auto-rotation" : "Play auto-rotation"}
          >
            {isPlaying ? <Pause className="size-3" /> : <Play className="size-3 fill-current" />}
          </button>
        </div>
      </div>
    </div>
  );
}
