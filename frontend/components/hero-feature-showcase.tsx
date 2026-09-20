"use client";

import React, { useState } from "react";
import { 
  AlertTriangle, 
  CheckCircle2, 
  Cpu, 
  Database, 
  ExternalLink, 
  GitPullRequest, 
  Info, 
  Layers, 
  RefreshCw, 
  Sparkles, 
  Zap 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface TabItem {
  id: string;
  number: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
}

const TABS: TabItem[] = [
  {
    id: "detect",
    number: "01",
    title: "Detect",
    desc: "Catches missing indexes, accidental Seq Scans & column wrapping directly from Git diffs.",
    icon: <Zap className="size-4" />,
  },
  {
    id: "quantify",
    number: "02",
    title: "Quantify",
    desc: "Translates microsecond execution deltas into attributed monthly AWS dollar projections.",
    icon: <Cpu className="size-4" />,
  },
  {
    id: "explain",
    number: "03",
    title: "Explain",
    desc: "Unwraps EXPLAIN JSON into buffer cache hits, disk reads, and loop multipliers.",
    icon: <Layers className="size-4" />,
  },
  {
    id: "guardrail",
    number: "04",
    title: "Guardrail",
    desc: "Posts idempotent PR comments with committable fixes and merge safety rules.",
    icon: <CheckCircle2 className="size-4" />,
  },
];

export function HeroFeatureShowcase() {
  const [activeTab, setActiveTab] = useState("detect");
  const [isFixed, setIsFixed] = useState(false);

  return (
    <section id="demo" className="relative py-12 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section title */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h2 className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-semibold mb-2">
            Interactive Product Walkthrough
          </h2>
          <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            How CostGate protects your database in CI/CD
          </p>
          <p className="mt-3 text-neutral-400 text-sm sm:text-base">
            Click through each pipeline phase below to see CostGate evaluate a real query regression on GitHub PR #42.
          </p>
        </div>

        {/* 4 Feature Tabs (CodeRabbit Style) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`text-left p-4 rounded-xl transition-all relative overflow-hidden border ${
                  isActive
                    ? "bg-[#161b22] border-emerald-500/50 shadow-lg shadow-emerald-500/10 text-white"
                    : "bg-[#0d1117]/60 border-white/[0.08] hover:bg-[#161b22]/50 hover:border-white/[0.15] text-neutral-400"
                }`}
              >
                {/* Active progress bar */}
                {isActive && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-cyan-400" />
                )}
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs text-neutral-500 font-bold">
                    {tab.number}
                  </span>
                  <div
                    className={`size-7 rounded-md flex items-center justify-center ${
                      isActive
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-white/[0.04] text-neutral-400"
                    }`}
                  >
                    {tab.icon}
                  </div>
                </div>
                <h3
                  className={`font-semibold text-base mb-1 ${
                    isActive ? "text-white" : "text-neutral-300"
                  }`}
                >
                  {tab.title}
                </h3>
                <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                  {tab.desc}
                </p>
              </button>
            );
          })}
        </div>

        {/* The GitHub Pull Request Mockup Viewport */}
        <div className="rounded-2xl border border-white/[0.12] bg-[#0d1117] shadow-2xl shadow-black/80 overflow-hidden">
          {/* PR Header Bar */}
          <div className="border-b border-white/[0.08] bg-[#161b22] px-4 py-3 sm:px-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5 rounded-full bg-purple-500/15 border border-purple-500/30 px-2.5 py-1 text-xs font-medium text-purple-300">
                <GitPullRequest className="size-3.5 text-purple-400" />
                <span>Open</span>
              </div>
              <span className="font-semibold text-white text-sm sm:text-base">
                feat(auth): normalize customer_id lookup in orders
              </span>
              <span className="text-neutral-500 text-sm font-mono">#42</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-neutral-400">
              <span className="hidden sm:inline">Branch:</span>
              <code className="rounded bg-black/40 px-2 py-0.5 font-mono text-emerald-400 border border-white/[0.08]">
                feature/customer-lookup
              </code>
              <span className="text-neutral-600">•</span>
              <span className="text-neutral-400">1 changed file</span>
            </div>
          </div>

          {/* GitHub PR Conversation stream */}
          <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            {/* The CostGate PR Review Comment Card */}
            <div className="rounded-xl border border-white/[0.1] bg-[#090d12] overflow-hidden shadow-md">
              {/* Comment Header */}
              <div className="flex items-center justify-between border-b border-white/[0.08] bg-[#161b22] px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <div className="size-6 rounded-md bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <Database className="size-3.5" />
                  </div>
                  <span className="font-semibold text-sm text-white">costgate</span>
                  <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px] h-4 px-1.5">
                    bot
                  </Badge>
                  <span className="text-neutral-500 text-xs hidden sm:inline">
                    commented 2 minutes ago
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`text-xs px-2.5 py-0.5 font-mono font-medium ${
                      isFixed
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                        : "border-amber-500/40 bg-amber-500/10 text-amber-400"
                    }`}
                  >
                    {isFixed ? "✅ Decrease of -$1,240.50/mo" : "⚠️ Increase of +$1,240.50/mo"}
                  </Badge>
                  <Badge variant="secondary" className="text-[11px] bg-white/[0.06] text-neutral-300">
                    Confidence: high
                  </Badge>
                </div>
              </div>

              {/* Comment Body */}
              <div className="p-4 sm:p-6 space-y-5 text-sm">
                {/* Cost summary headline */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                  <div>
                    <div className="text-xs text-neutral-400 font-medium">Attributed Monthly Infrastructure Impact</div>
                    <div className="text-xl sm:text-2xl font-black tracking-tight mt-0.5 flex items-center gap-2">
                      <span className={isFixed ? "text-emerald-400" : "text-amber-400"}>
                        {isFixed ? "-$1,240.50" : "+$1,240.50"} / month
                      </span>
                      <span className="text-xs font-normal text-neutral-400">
                        (est. range: {isFixed ? "-$992 – -$1,488" : "+$992 – +$1,488"})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => setIsFixed(!isFixed)}
                      className={`text-xs h-8 font-medium transition-all ${
                        isFixed
                          ? "bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                          : "bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold shadow-md shadow-emerald-500/20"
                      }`}
                    >
                      <RefreshCw className={`size-3.5 mr-1.5 ${isFixed ? "rotate-180" : ""}`} />
                      {isFixed ? "Revert to Regressed Query" : "Simulate Index Fix"}
                    </Button>
                  </div>
                </div>

                {/* Query Change Diff View */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-neutral-200 text-xs flex items-center gap-2">
                      <span className="font-mono text-neutral-400">File:</span>
                      <code className="text-cyan-300">db/experiments/customer_lookup.sql</code>
                    </span>
                    <span className="text-[11px] text-neutral-500 font-mono">
                      {isFixed ? "Index-aware query" : "Function-wrapped WHERE predicate"}
                    </span>
                  </div>

                  <div className="rounded-lg border border-white/[0.08] bg-[#0c1017] font-mono text-xs overflow-x-auto">
                    {isFixed ? (
                      <div className="p-3 text-emerald-300">
                        <div className="text-neutral-500">-- Fixed: direct index equality on customer_id</div>
                        <div className="text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded mt-1">
                          SELECT id, customer_id, status, total_cents FROM orders WHERE customer_id = 12345;
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 space-y-1">
                        <div className="text-neutral-500">-- Baseline (Production)</div>
                        <div className="text-neutral-300 bg-white/[0.02] px-2 py-0.5 rounded">
                          SELECT id, customer_id, status, total_cents FROM orders WHERE customer_id = 12345;
                        </div>
                        <div className="text-neutral-500 pt-1">-- Candidate (This Pull Request)</div>
                        <div className="text-red-400 bg-red-500/10 px-2 py-0.5 rounded flex items-center justify-between">
                          <span>- WHERE customer_id = 12345;</span>
                          <span className="text-[10px] text-red-400/80 font-sans">Index Scan</span>
                        </div>
                        <div className="text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded flex items-center justify-between">
                          <span>+ WHERE LOWER(customer_id::text) = &apos;12345&apos;;</span>
                          <span className="text-[10px] text-amber-400 font-sans font-semibold">Forces Full Seq Scan</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Execution Impact Metrics Table */}
                <div>
                  <div className="font-semibold text-neutral-200 text-xs mb-2">
                    PostgreSQL Execution Plan Comparison
                  </div>
                  <div className="overflow-x-auto rounded-lg border border-white/[0.08]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#161b22] text-neutral-400 font-medium border-b border-white/[0.08]">
                        <tr>
                          <th className="py-2.5 px-3">Metric</th>
                          <th className="py-2.5 px-3 text-right">Baseline</th>
                          <th className="py-2.5 px-3 text-right">Candidate (PR)</th>
                          <th className="py-2.5 px-3 text-right">Delta / Impact</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.06] text-neutral-300 font-mono">
                        <tr className="hover:bg-white/[0.02]">
                          <td className="py-2 px-3 font-sans font-medium text-neutral-200">Execution time</td>
                          <td className="py-2 px-3 text-right text-emerald-400">0.124 ms</td>
                          <td className="py-2 px-3 text-right text-amber-400 font-semibold">
                            {isFixed ? "0.118 ms" : "16.825 ms"}
                          </td>
                          <td className="py-2 px-3 text-right text-amber-400 font-bold">
                            {isFixed ? "1.0×" : "+16.701 ms (135.6× slower)"}
                          </td>
                        </tr>
                        <tr className="hover:bg-white/[0.02]">
                          <td className="py-2 px-3 font-sans font-medium text-neutral-200">Scan strategy</td>
                          <td className="py-2 px-3 text-right text-emerald-400">Index Scan</td>
                          <td className="py-2 px-3 text-right text-amber-400">
                            {isFixed ? "Index Scan" : "Seq Scan"}
                          </td>
                          <td className="py-2 px-3 text-right text-neutral-400">
                            {isFixed ? "Retains B-Tree index" : "Drops index usage"}
                          </td>
                        </tr>
                        <tr className="hover:bg-white/[0.02]">
                          <td className="py-2 px-3 font-sans font-medium text-neutral-200">Shared buffer blocks</td>
                          <td className="py-2 px-3 text-right">9 blocks</td>
                          <td className="py-2 px-3 text-right text-amber-400 font-semibold">
                            {isFixed ? "9 blocks" : "2,500 blocks"}
                          </td>
                          <td className="py-2 px-3 text-right text-amber-400">
                            {isFixed ? "0 delta" : "+2,491 blocks (277× memory spike)"}
                          </td>
                        </tr>
                        <tr className="hover:bg-white/[0.02]">
                          <td className="py-2 px-3 font-sans font-medium text-neutral-200">Rows scanned / filtered</td>
                          <td className="py-2 px-3 text-right">6 / 0</td>
                          <td className="py-2 px-3 text-right">
                            {isFixed ? "6 / 0" : "6 / 299,994 removed"}
                          </td>
                          <td className="py-2 px-3 text-right text-neutral-400">
                            {isFixed ? "Direct seek" : "Scanned entire 300k table"}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Committable Suggestion (CodeRabbit Signature Feature) */}
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/[0.04] p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-emerald-400 flex items-center gap-1.5">
                      <Sparkles className="size-3.5" />
                      CostGate Committable Suggestion
                    </span>
                    <span className="text-[11px] text-neutral-400">Saves ~$1,240/month</span>
                  </div>
                  <p className="text-xs text-neutral-300">
                    Wrapping <code className="text-amber-300">LOWER(customer_id::text)</code> prevents PostgreSQL from using index <code className="text-emerald-300">idx_orders_customer_id</code>. Either keep the integer comparison or add an expression index:
                  </p>
                  <pre className="rounded bg-black/50 p-2.5 font-mono text-xs text-emerald-300 border border-emerald-500/20 overflow-x-auto">
                    CREATE INDEX CONCURRENTLY idx_orders_customer_id_lower ON orders (LOWER(customer_id::text));
                  </pre>
                </div>

                {/* Assumptions note */}
                <div className="text-[11px] text-neutral-500 flex items-center justify-between pt-1">
                  <span>Assumptions: 10,000,000 req/mo • db.t4g.small ($0.04/hr) • Attributed database compute</span>
                  <span className="italic">_Generated by CostGate v1.0_</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
