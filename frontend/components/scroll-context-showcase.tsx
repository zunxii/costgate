"use client";

import React, { useState, useEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepData {
  id: string;
  title: string;
  subtitle: string;
}

const STEPS: StepData[] = [
  {
    id: "codegraph",
    title: "Codegraph",
    subtitle: "Builds a deterministic map of every node affected by the change.",
  },
  {
    id: "adaptive-systems",
    title: "Adaptive systems",
    subtitle: "Gathers related history, docs, and team context.",
  },
  {
    id: "business-context",
    title: "Business context",
    subtitle: "Brings in context from PRDs, issues, and internal docs.",
  },
  {
    id: "review-generation",
    title: "Review generation",
    subtitle: "Agentic exploration, static verification, and cost analysis.",
  },
  {
    id: "ensemble-models",
    title: "Ensemble of models & tools",
    subtitle: "Multiple models solving difficult problems to their strengths.",
  },
];

// Reusable SVG Network Graph Nodes
const GRAPH_NODES = [
  { cx: 180, cy: 150, r: 4 },
  { cx: 220, cy: 120, r: 3 },
  { cx: 260, cy: 160, r: 4 },
  { cx: 210, cy: 190, r: 3 },
  { cx: 150, cy: 180, r: 3 },
  { cx: 130, cy: 130, r: 4 },
  { cx: 160, cy: 90, r: 3 },
  { cx: 200, cy: 70, r: 4 },
  { cx: 250, cy: 90, r: 3 },
  { cx: 290, cy: 130, r: 4 },
  { cx: 300, cy: 180, r: 3 },
  { cx: 270, cy: 220, r: 4 },
  { cx: 220, cy: 240, r: 3 },
  { cx: 170, cy: 230, r: 4 },
  { cx: 130, cy: 210, r: 3 },
  { cx: 100, cy: 160, r: 4 },
  { cx: 110, cy: 110, r: 3 },
  { cx: 140, cy: 60, r: 3 },
  { cx: 190, cy: 40, r: 4 },
  { cx: 240, cy: 50, r: 3 },
  { cx: 280, cy: 70, r: 4 },
  { cx: 320, cy: 110, r: 3 },
  { cx: 330, cy: 160, r: 4 },
  { cx: 310, cy: 210, r: 3 },
  { cx: 280, cy: 250, r: 4 },
  { cx: 230, cy: 270, r: 3 },
  { cx: 180, cy: 270, r: 4 },
  { cx: 130, cy: 250, r: 3 },
  { cx: 90, cy: 200, r: 4 },
  { cx: 80, cy: 140, r: 3 },
  { cx: 100, cy: 90, r: 4 },
  { cx: 160, cy: 140, r: 3 },
  { cx: 200, cy: 140, r: 4 },
  { cx: 240, cy: 150, r: 3 },
  { cx: 230, cy: 180, r: 4 },
  { cx: 190, cy: 170, r: 3 },
  { cx: 170, cy: 110, r: 4 },
  { cx: 210, cy: 100, r: 3 },
  { cx: 250, cy: 130, r: 4 },
  { cx: 260, cy: 190, r: 3 },
];

const GRAPH_EDGES = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 0],
  [0, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 10], [10, 11], [11, 12], [12, 13], [13, 14], [14, 15], [15, 5],
  [6, 17], [7, 18], [8, 19], [9, 20], [10, 21], [11, 22], [12, 23], [13, 24], [14, 25], [15, 26], [16, 27], [5, 28],
  [31, 32], [32, 33], [33, 34], [34, 35], [35, 31],
  [36, 37], [37, 38], [38, 39], [39, 36],
  [0, 31], [1, 37], [2, 38], [3, 39], [4, 35],
];

export function ScrollContextShowcase() {
  const [activeIdx, setActiveIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      if (scrollable <= 0) return;

      const currentScroll = -rect.top;
      const progress = Math.max(0, Math.min(1, currentScroll / scrollable));
      const stepIndex = Math.min(STEPS.length - 1, Math.floor(progress * STEPS.length));
      setActiveIdx(stepIndex);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleItemClick = (idx: number) => {
    setActiveIdx(idx);
    if (containerRef.current) {
      const containerTop = containerRef.current.getBoundingClientRect().top + window.scrollY;
      const scrollable = containerRef.current.offsetHeight - window.innerHeight;
      const targetScroll = containerTop + (idx / (STEPS.length - 1)) * scrollable;
      window.scrollTo({ top: targetScroll, behavior: "smooth" });
    }
  };

  return (
    <div ref={containerRef} className="relative h-[300vh] w-full bg-background border-t border-border">
      {/* Sticky Viewport Container */}
      <div className="sticky top-16 md:top-20 h-[calc(100vh-5rem)] flex flex-col justify-center px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-6 text-left">
          <div className="text-[10px] font-mono tracking-widest text-muted-foreground font-semibold uppercase mb-2">
            SHARED INTELLIGENCE
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold text-foreground tracking-tight leading-[1.1]">
            Best-in-class context.
          </h2>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-xl font-medium">
            Across each step, we pull in dozens more points of context than other tools.
          </p>
        </div>

        {/* Stage */}
        <div className="rounded-lg p-6 sm:p-8 md:p-10 border border-border bg-card shadow-sm relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center min-h-[400px] md:min-h-[440px]">
            
            {/* Left Column (4 Cols): Progression Items */}
            <div className="lg:col-span-4 flex flex-col justify-center relative pr-4 lg:pr-8 border-b lg:border-b-0 lg:border-r border-border pb-6 lg:pb-0">
              <div className="space-y-6 md:space-y-7 relative">
                {/* Continuous Track Line */}
                <div className="absolute top-2 bottom-2 right-0 w-[1px] bg-border hidden lg:block" />

                {STEPS.map((step, idx) => {
                  const isActive = activeIdx === idx;
                  return (
                    <div
                      key={step.id}
                      onClick={() => handleItemClick(idx)}
                      className="group cursor-pointer text-left relative transition-all duration-200"
                    >
                      {/* Active Indicator Bar */}
                      {isActive && (
                        <div className="absolute top-0 bottom-0 -right-[17px] lg:-right-[33px] w-[2px] bg-primary hidden lg:block" />
                      )}

                      <h3
                        className={cn("text-base sm:text-lg transition-colors",
                          isActive
                            ? "font-bold text-foreground"
                            : "font-semibold text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {step.title}
                      </h3>

                      {isActive && (
                        <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed font-medium animate-in fade-in max-w-xs">
                          {step.subtitle}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column (8 Cols): Stage */}
            <div className="lg:col-span-8 relative h-[360px] sm:h-[420px] rounded border border-border bg-muted/30 flex items-center justify-center overflow-hidden">
              
              {/* STAGE 1: Codegraph */}
              {activeIdx === 0 && (
                <div className="relative size-full flex items-center justify-center animate-in fade-in">
                  <svg className="size-[320px] sm:size-[380px]" viewBox="0 0 400 320">
                    {GRAPH_EDGES.map(([u, v], i) => (
                      <line
                        key={i}
                        x1={GRAPH_NODES[u].cx}
                        y1={GRAPH_NODES[u].cy}
                        x2={GRAPH_NODES[v].cx}
                        y2={GRAPH_NODES[v].cy}
                        stroke="currentColor"
                        className="text-border"
                        strokeWidth="1"
                      />
                    ))}
                    {GRAPH_NODES.map((node, i) => (
                      <circle key={i} cx={node.cx} cy={node.cy} r={node.r} fill="currentColor" className="text-muted-foreground" />
                    ))}

                    <line x1="260" y1="220" x2="270" y2="280" stroke="currentColor" className="text-primary" strokeWidth="1.5" />
                    <line x1="260" y1="220" x2="190" y2="270" stroke="currentColor" className="text-primary" strokeWidth="1.5" />
                    <line x1="260" y1="220" x2="285" y2="170" stroke="currentColor" className="text-primary" strokeWidth="1.5" />
                    <line x1="260" y1="220" x2="255" y2="135" stroke="currentColor" className="text-primary" strokeWidth="1.5" />

                    <circle cx="270" cy="280" r="4" fill="currentColor" className="text-background" stroke="currentColor" style={{stroke: 'var(--primary)'}} strokeWidth="1.5" />
                    <circle cx="190" cy="270" r="4" fill="currentColor" className="text-background" stroke="currentColor" style={{stroke: 'var(--primary)'}} strokeWidth="1.5" />
                    <circle cx="285" cy="170" r="4" fill="currentColor" className="text-background" stroke="currentColor" style={{stroke: 'var(--primary)'}} strokeWidth="1.5" />
                    <circle cx="255" cy="135" r="4" fill="currentColor" className="text-background" stroke="currentColor" style={{stroke: 'var(--primary)'}} strokeWidth="1.5" />

                    <circle cx="260" cy="220" r="5" fill="currentColor" className="text-primary" />
                  </svg>

                  <div className="absolute top-[52%] left-[58%] sm:left-[56%] -translate-y-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded bg-background border border-border shadow-sm text-[11px] font-mono font-bold text-foreground">
                    <span>+8</span>
                    <span className="text-muted">|</span>
                    <span>135-142</span>
                  </div>
                </div>
              )}

              {/* STAGE 2: Adaptive systems */}
              {activeIdx === 1 && (
                <div className="relative size-full flex items-center justify-center animate-in fade-in">
                  <div className="relative ml-24 sm:ml-36">
                    <svg className="size-[280px] sm:size-[320px]" viewBox="0 0 400 320">
                      <circle cx="200" cy="160" r="140" fill="none" stroke="currentColor" className="text-primary" strokeWidth="1.5" strokeDasharray="5 5" opacity="0.8" />
                      {GRAPH_EDGES.map(([u, v], i) => (
                        <line key={i} x1={GRAPH_NODES[u].cx} y1={GRAPH_NODES[u].cy} x2={GRAPH_NODES[v].cx} y2={GRAPH_NODES[v].cy} stroke="currentColor" className="text-border" strokeWidth="1" />
                      ))}
                      {GRAPH_NODES.map((node, i) => (
                        <circle key={i} cx={node.cx} cy={node.cy} r={node.r} fill="currentColor" className="text-muted-foreground" />
                      ))}
                    </svg>
                  </div>

                  <div className="absolute left-8 sm:left-14 top-1/2 -translate-y-1/2 space-y-2 z-20">
                    {[
                      "Codebase Systems",
                      "Configurations",
                      "History",
                      "Learnings",
                      "Knowledge Base",
                    ].map((item, i) => (
                      <div
                        key={item}
                        className={cn("px-3 py-1.5 rounded text-[11px] font-semibold font-mono border shadow-sm",
                          i === 0
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background border-border text-muted-foreground"
                        )}
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STAGE 3: Business context */}
              {activeIdx === 2 && (
                <div className="relative size-full flex items-center justify-center animate-in fade-in">
                  <div className="relative mr-24 sm:mr-36">
                    <svg className="size-[280px] sm:size-[320px]" viewBox="0 0 400 320">
                      <circle cx="200" cy="160" r="140" fill="none" stroke="currentColor" className="text-emerald-500" strokeWidth="1.5" strokeDasharray="5 5" opacity="0.9" />
                      {GRAPH_EDGES.map(([u, v], i) => (
                        <line key={i} x1={GRAPH_NODES[u].cx} y1={GRAPH_NODES[u].cy} x2={GRAPH_NODES[v].cx} y2={GRAPH_NODES[v].cy} stroke="currentColor" className="text-border" strokeWidth="1" />
                      ))}
                      {GRAPH_NODES.map((node, i) => (
                        <circle key={i} cx={node.cx} cy={node.cy} r={node.r} fill="currentColor" className="text-muted-foreground" />
                      ))}
                    </svg>
                  </div>

                  <div className="absolute right-8 sm:right-14 top-1/2 -translate-y-1/2 space-y-2 z-20">
                    {[
                      "Business",
                      "Tracked Issues",
                      "PRDs, Docs, etc.",
                      "Concerns / Security",
                      "Priorities",
                    ].map((item, i) => (
                      <div
                        key={item}
                        className={cn("px-3 py-1.5 rounded text-[11px] font-semibold font-mono border shadow-sm",
                          i === 0
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "bg-background border-border text-muted-foreground"
                        )}
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STAGE 4: Review generation */}
              {activeIdx === 3 && (
                <div className="relative size-full flex items-center justify-center animate-in fade-in">
                  <svg className="size-[300px] sm:size-[340px]" viewBox="0 0 400 320">
                    <circle cx="200" cy="160" r="145" fill="none" stroke="currentColor" className="text-primary" strokeWidth="2" opacity="0.9" />
                    <circle cx="200" cy="160" r="138" fill="none" stroke="currentColor" className="text-emerald-500" strokeWidth="1.5" strokeDasharray="6 6" opacity="0.8" />
                    <circle cx="200" cy="160" r="130" fill="none" stroke="currentColor" className="text-muted-foreground" strokeWidth="1.5" strokeDasharray="6 6" opacity="0.7" />

                    {GRAPH_EDGES.map(([u, v], i) => (
                      <line key={i} x1={GRAPH_NODES[u].cx} y1={GRAPH_NODES[u].cy} x2={GRAPH_NODES[v].cx} y2={GRAPH_NODES[v].cy} stroke="currentColor" className="text-border" strokeWidth="1" />
                    ))}
                    {GRAPH_NODES.map((node, i) => {
                      let nodeFill = "currentColor";
                      let className = "text-muted-foreground";
                      if (i < 10) className = "text-emerald-500";
                      else if (i >= 20) className = "text-primary";
                      return <circle key={i} cx={node.cx} cy={node.cy} r={node.r} fill={nodeFill} className={className} />;
                    })}
                  </svg>
                </div>
              )}

              {/* STAGE 5: Ensemble of models & tools */}
              {activeIdx === 4 && (
                <div className="relative size-full flex items-center justify-between p-4 sm:p-8 animate-in fade-in">
                  <div className="relative flex items-center shrink-0">
                    <div className="relative size-60 sm:size-68 flex items-center justify-center -ml-20 sm:-ml-28">
                      <div className="absolute size-[85%] rounded-full border-2 border-primary" />
                      <div className="absolute size-[95%] rounded-full border border-dashed border-emerald-500/50" />
                      <div className="absolute size-[75%] rounded-full border border-dashed border-muted-foreground/40" />

                      <div className="absolute size-[55%] rounded-full bg-muted border border-border flex items-center justify-center">
                        <div className="grid grid-cols-4 gap-2 opacity-60">
                          {Array.from({ length: 16 }).map((_, i) => (
                            <div key={i} className="size-1 rounded bg-muted-foreground" />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-[11px] font-mono -ml-6 sm:-ml-8 z-20">
                      <div className="flex items-center gap-1.5 text-foreground font-semibold">
                        <span className="size-1.5 rounded bg-primary" />
                        <span>GPT-5.1 · effort: medium</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-foreground font-semibold">
                        <span className="size-1.5 rounded bg-primary" />
                        <span>Claude Opus 5 · effort: medium</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-foreground font-semibold">
                        <span className="size-1.5 rounded bg-primary" />
                        <span>Claude Sonnet 5 · effort: high</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-foreground font-semibold">
                        <span className="size-1.5 rounded bg-primary" />
                        <span>Gemini 3.5 Flash · thinking: high</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-foreground font-semibold">
                        <span className="size-1.5 rounded bg-primary" />
                        <span>Grok 4.5 · reasoning</span>
                      </div>

                      <div className="text-muted-foreground text-[10px] pl-3 py-0.5">...</div>

                      <div className="flex items-center gap-1.5 text-emerald-600">
                        <span className="size-1.5 rounded bg-emerald-500" />
                        <span>Knowledge Base</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <span className="size-1.5 rounded bg-muted-foreground/50" />
                        <span>CVEs/sec disclosures</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-600">
                        <span className="size-1.5 rounded bg-emerald-500" />
                        <span>SAST & linters</span>
                      </div>
                    </div>

                    <div className="hidden xl:flex items-center ml-4 text-border shrink-0">
                      <div className="w-10 h-[1px] bg-border" />
                      <ArrowRight className="size-4 -ml-1 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="hidden xl:block w-full max-w-sm space-y-3 z-20">
                    <div className="bg-background rounded overflow-hidden border border-border shadow-sm">
                      <div className="bg-muted px-3 py-1.5 border-b border-border flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                        <span className="font-semibold text-foreground">stream_controller.ts</span>
                        <span className="text-emerald-700 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-bold">
                          +8 | 135-142
                        </span>
                      </div>
                      <div className="p-3 bg-[#09090b] font-mono text-[10px] text-slate-300 space-y-0.5">
                        <div>135  stop(): void &#123;</div>
                        <div>136    if (!this.clientState.runId) return;</div>
                        <div>137    this.openStream(&#123; abort: true &#125;);</div>
                        <div>138  &#125;</div>
                      </div>
                    </div>

                    <div className="bg-background rounded p-3 border border-border shadow-sm space-y-1.5 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="size-4 rounded bg-primary flex items-center justify-center text-[9px] text-primary-foreground font-bold">⚡</span>
                        <span className="font-bold text-foreground text-[11px]">costgate</span>
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground border border-border font-mono">Bot</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] pt-0.5">
                        <span className="text-primary font-bold">⚠️ Potential issue</span>
                        <span className="text-muted">|</span>
                        <span className="text-destructive font-bold">🔴 Critical</span>
                      </div>
                      <p className="text-[11px] text-foreground font-sans">
                        <code className="text-foreground font-mono bg-muted px-1 rounded border border-border">stop()</code> does not actually execute the abort stream request.
                      </p>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Bottom Pagination Indicator */}
        <div className="mt-4 flex items-center justify-center gap-2 text-[11px] font-mono text-muted-foreground uppercase tracking-wider font-semibold">
          <span>Scroll progress ({activeIdx + 1}/5)</span>
          <div className="flex items-center gap-1 ml-2">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={cn("h-1 rounded transition-all duration-300",
                  activeIdx === i ? "w-4 bg-primary" : "w-1 bg-border"
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
