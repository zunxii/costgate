"use client";

import React, { useState } from "react";
import { 
  Calculator, 
  Database, 
  TrendingUp, 
  Clock, 
  Cpu, 
  Zap, 
  DollarSign, 
  Server, 
  AlertCircle 
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { formatNumber, formatCurrency } from "@/lib/formatters";

interface QueryScenario {
  id: string;
  name: string;
  table: string;
  tableRows: string;
  baselineTimeMs: number;
  candidateTimeMs: number;
  deltaMs: number;
  scanChange: string;
  description: string;
}

const SCENARIOS: QueryScenario[] = [
  {
    id: "fk-lookup",
    name: "Unindexed Foreign Key Filter",
    table: "orders",
    tableRows: "300,000 rows",
    baselineTimeMs: 0.12,
    candidateTimeMs: 16.82,
    deltaMs: 16.7,
    scanChange: "Index Scan → Seq Scan",
    description: "Predicate wrapped in LOWER() or unindexed customer_id lookup across 300,000 orders.",
  },
  {
    id: "sku-search",
    name: "Unindexed SKU Text Lookup",
    table: "order_items",
    tableRows: "900,000 rows",
    baselineTimeMs: 0.35,
    candidateTimeMs: 48.6,
    deltaMs: 48.25,
    scanChange: "Index Scan → Parallel Seq Scan",
    description: "Scanning 900,000 order items without a composite or B-Tree index on SKU.",
  },
  {
    id: "unbounded-sort",
    name: "Full Table Sort without Index",
    table: "orders",
    tableRows: "300,000 rows",
    baselineTimeMs: 1.4,
    candidateTimeMs: 84.2,
    deltaMs: 82.8,
    scanChange: "Index Scan → External Merge Disk Sort",
    description: "ORDER BY created_at DESC with spilled work_mem to disk.",
  },
];

interface InstanceTier {
  id: string;
  name: string;
  vCpu: number;
  ramGb: number;
  hourlyUsd: number;
}

const INSTANCES: InstanceTier[] = [
  { id: "db.t4g.small", name: "db.t4g.small", vCpu: 2, ramGb: 2, hourlyUsd: 0.04 },
  { id: "db.m6g.large", name: "db.m6g.large", vCpu: 2, ramGb: 8, hourlyUsd: 0.13 },
  { id: "db.r6g.xlarge", name: "db.r6g.xlarge", vCpu: 4, ramGb: 32, hourlyUsd: 0.52 },
  { id: "db.r6g.4xlarge", name: "db.r6g.4xlarge", vCpu: 16, ramGb: 128, hourlyUsd: 2.08 },
];

export function InteractiveCostCalculator() {
  const [selectedScenario, setSelectedScenario] = useState<QueryScenario>(SCENARIOS[0]);
  const [monthlyRequests, setMonthlyRequests] = useState<number>(5_000_000);
  const [selectedInstance, setSelectedInstance] = useState<InstanceTier>(INSTANCES[0]);

  // Cost calculation formula from CostGate cost_engine
  const deltaSeconds = selectedScenario.deltaMs / 1000;
  const monthlyComputeSeconds = deltaSeconds * monthlyRequests;
  const monthlyComputeHours = monthlyComputeSeconds / 3600;
  const monthlyCostDelta = monthlyComputeHours * selectedInstance.hourlyUsd;
  const annualizedCostDelta = monthlyCostDelta * 12;

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section id="calculator" className="py-16 md:py-24 border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-mono font-bold text-primary mb-3">
            <span>REAL-TIME SIMULATION</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
            Interactive Infrastructure Cost Simulator
          </h2>
          <p className="mt-3 text-muted-foreground text-sm sm:text-base font-medium">
            See how small microsecond query delays translate into massive monthly AWS RDS invoices at scale.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls Column (7 cols) */}
          <div className="lg:col-span-7 space-y-6 rounded-lg border border-border bg-card p-6 sm:p-8 shadow-sm">
            {/* 1. Select Scenario */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold mb-3">
                1. Select Regression Scenario
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {SCENARIOS.map((sc) => (
                  <button
                    key={sc.id}
                    onClick={() => setSelectedScenario(sc)}
                    className={`p-3 rounded border text-left transition-all ${
                      selectedScenario.id === sc.id
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border bg-muted/50 hover:border-primary/30 hover:bg-muted"
                    }`}
                  >
                    <div className="font-semibold text-xs text-foreground truncate">{sc.name}</div>
                    <div className="text-[11px] text-muted-foreground mt-1 flex items-center justify-between font-medium">
                      <span>{sc.table}</span>
                      <span className="text-primary font-mono font-bold">+{sc.deltaMs}ms</span>
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2 font-medium">
                {selectedScenario.description} ({selectedScenario.tableRows})
              </p>
            </div>

            {/* 2. Monthly Request Slider */}
            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                  2. Monthly Query Traffic
                </label>
                <span className="font-mono text-base font-bold text-primary">
                  {formatNumber(monthlyRequests)} req / month
                </span>
              </div>
              <Slider
                value={[monthlyRequests]}
                min={200_000}
                max={25_000_000}
                step={200_000}
                onValueChange={(val: any) => setMonthlyRequests(Array.isArray(val) ? val[0] : val)}
                className="py-4"
              />
              <div className="flex justify-between text-[11px] text-muted-foreground font-mono font-medium">
                <span>200k (Small SaaS)</span>
                <span>5M (Growth)</span>
                <span>25M (High Scale)</span>
              </div>
            </div>

            {/* 3. RDS Instance Class */}
            <div className="pt-4 border-t border-border">
              <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold mb-3">
                3. AWS RDS Instance Class
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {INSTANCES.map((inst) => (
                  <button
                    key={inst.id}
                    onClick={() => setSelectedInstance(inst)}
                    className={`p-3 rounded border text-left transition-all ${
                      selectedInstance.id === inst.id
                        ? "border-emerald-500 bg-emerald-500/5 shadow-sm"
                        : "border-border bg-muted/50 hover:border-emerald-500/30 hover:bg-muted"
                    }`}
                  >
                    <div className="font-mono text-[11px] font-bold text-foreground">{inst.name}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5 font-medium">
                      {inst.vCpu} vCPU • {inst.ramGb}GB
                    </div>
                    <div className="text-[11px] text-emerald-600 font-bold mt-1 font-mono">
                      ${inst.hourlyUsd}/hr
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results Column (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Primary Impact Card */}
            <div className="rounded-lg border border-border bg-card p-6 sm:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-mono font-bold text-primary flex items-center gap-1.5 uppercase tracking-wider">
                  <AlertCircle className="size-3.5" />
                  Projected Cloud Impact
                </span>
                <div className="rounded border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-mono font-bold text-primary">
                  High Confidence
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Attributed Monthly Database Bill Spike</div>
                <div className="text-4xl sm:text-5xl font-black text-foreground tracking-tight font-mono">
                  +{formatCurrency(monthlyCostDelta)}
                  <span className="text-base text-muted-foreground font-sans font-medium"> / mo</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-[13px] font-medium">
                <span className="text-muted-foreground">Annualized Run Rate:</span>
                <span className="font-bold text-foreground font-mono">
                  +{formatCurrency(annualizedCostDelta)} / yr
                </span>
              </div>
            </div>

            {/* Granular Breakdown Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center gap-2 text-muted-foreground text-[11px] font-semibold uppercase tracking-wider mb-2">
                  <Clock className="size-3.5 text-primary" />
                  <span>Extra Compute Time</span>
                </div>
                <div className="font-mono text-lg font-bold text-foreground">
                  {monthlyComputeHours.toFixed(1)} hrs
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5 font-medium">CPU hours per month</div>
              </div>

              <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center gap-2 text-muted-foreground text-[11px] font-semibold uppercase tracking-wider mb-2">
                  <Zap className="size-3.5 text-primary" />
                  <span>Execution Slowdown</span>
                </div>
                <div className="font-mono text-lg font-bold text-foreground">
                  {(selectedScenario.candidateTimeMs / selectedScenario.baselineTimeMs).toFixed(0)}× Slower
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5 font-medium">per single execution</div>
              </div>
            </div>

            {/* CostGate Protection callout */}
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 flex items-start gap-3 shadow-sm">
              <div className="size-7 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5 border border-primary/20">
                <Database className="size-4" />
              </div>
              <div className="text-xs space-y-1">
                <span className="font-bold text-foreground">How CostGate prevents this</span>
                <p className="text-muted-foreground leading-relaxed font-medium">
                  CostGate runs this query on an isolated shadow replica in under 2 seconds. The PR is flagged with a warning before your staging or production RDS instances suffer CPU spikes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
