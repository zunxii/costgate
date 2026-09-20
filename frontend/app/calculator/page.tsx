"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calculator, 
  ChevronRight, 
  Database, 
  TrendingUp, 
  Clock, 
  Server, 
  Leaf, 
  ArrowRight, 
  HelpCircle,
  Settings2,
  Sparkles
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { formatNumber, formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";

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
    scanChange: "Index Scan → Disk Merge Sort",
    description: "ORDER BY created_at DESC with spilled work_mem to disk.",
  },
  {
    id: "n-plus-one",
    name: "N+1 ORM Relation Eager Loading",
    table: "users + permissions",
    tableRows: "150,000 rows",
    baselineTimeMs: 0.8,
    candidateTimeMs: 112.5,
    deltaMs: 111.7,
    scanChange: "Batched Join → 250 Iterative Sub-Queries",
    description: "Looping through entity IDs and making 250 individual round-trip queries per request.",
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
  { id: "db.t4g.small", name: "db.t4g.small (Burstable)", vCpu: 2, ramGb: 2, hourlyUsd: 0.04 },
  { id: "db.m6g.large", name: "db.m6g.large (General Purpose)", vCpu: 2, ramGb: 8, hourlyUsd: 0.13 },
  { id: "db.r6g.xlarge", name: "db.r6g.xlarge (Memory Optimized)", vCpu: 4, ramGb: 32, hourlyUsd: 0.52 },
  { id: "db.r6g.4xlarge", name: "db.r6g.4xlarge (High Throughput)", vCpu: 16, ramGb: 128, hourlyUsd: 2.08 },
];

// Animation variants for smooth mounting
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const itemVariants: any = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function CalculatorPage() {
  const [selectedScenario, setSelectedScenario] = useState<QueryScenario>(SCENARIOS[0]);
  const [monthlyRequests, setMonthlyRequests] = useState<number>(5_000_000);
  const [selectedInstance, setSelectedInstance] = useState<InstanceTier>(INSTANCES[2]);
  const [isMultiAz, setIsMultiAz] = useState<boolean>(true);

  const deltaSeconds = selectedScenario.deltaMs / 1000;
  const monthlyComputeSeconds = deltaSeconds * monthlyRequests;
  const monthlyComputeHours = monthlyComputeSeconds / 3600;
  const baseMonthlyCost = monthlyComputeHours * selectedInstance.hourlyUsd;
  const multiplier = isMultiAz ? 2 : 1;
  const monthlyCostDelta = baseMonthlyCost * multiplier;
  const annualizedCostDelta = monthlyCostDelta * 12;
  const carbonKgEstimate = monthlyComputeHours * 0.045 * multiplier;

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-orange-100 selection:text-orange-900 pb-24 relative overflow-hidden">
      
      {/* Background Ambient Glows with subtle pulse */}
      <motion.div 
        animate={{ scale: [1, 1.05, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-10%] left-[20%] w-[800px] h-[600px] bg-orange-500/10 rounded-full blur-[120px] pointer-events-none mix-blend-multiply" 
      />
      <motion.div 
        animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute top-[30%] right-[-10%] w-[600px] h-[600px] bg-amber-400/10 rounded-full blur-[120px] pointer-events-none mix-blend-multiply" 
      />
      
      {/* Refined Header (Glassmorphic) */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="sticky top-0 z-20 bg-white/60 backdrop-blur-xl border-b border-white/50 shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 text-[13px] font-medium text-slate-500">
            <Link href="/" className="hover:text-slate-900 transition-colors">Home</Link>
            <ChevronRight className="size-3 text-slate-300" />
            <span className="text-slate-900 font-semibold flex items-center gap-1.5 bg-white/50 px-2.5 py-1 rounded-full border border-white/80 shadow-sm">
              <Calculator className="size-3.5 text-orange-500" />
              FinOps Cost Simulator
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/demo"
              className="text-[13px] font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 bg-white hover:bg-slate-50 px-4 py-2 rounded-full border border-slate-200 shadow-sm transition-all"
            >
              Interactive PR Studio <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </motion.div>

      <div className="max-w-6xl mx-auto px-6 pt-16 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-14 max-w-2xl"
        >
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-slate-900 mb-4">
            Calculate the impact of bad queries.
          </h1>
          <p className="text-lg text-slate-500 leading-relaxed font-light">
            Model how execution plan regressions convert into attributed AWS RDS and Aurora monthly billing impact.
          </p>
        </motion.div>

        {/* Main Interactive Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
        >
          
          {/* LEFT CONTROLS: 7 Columns */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* 1. Scenario Selection */}
            <motion.div variants={itemVariants} className="bg-white/70 backdrop-blur-2xl rounded-2xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden transition-all duration-300 hover:shadow-[0_8px_40px_rgb(0,0,0,0.06)]">
              <div className="bg-white/40 border-b border-black/[0.04] px-6 py-5 flex items-center justify-between">
                <span className="text-[12px] font-semibold uppercase tracking-widest text-slate-600 flex items-center gap-2.5">
                  <span className="flex items-center justify-center size-6 rounded-full bg-orange-100 text-orange-600">
                    <Database className="size-3.5" />
                  </span>
                  1. Query Regression
                </span>
                <motion.span 
                  key={selectedScenario.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-[11px] font-mono text-orange-600 bg-orange-50/80 px-2.5 py-1 rounded-full border border-orange-100/50 font-semibold"
                >
                  {selectedScenario.scanChange}
                </motion.span>
              </div>
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {SCENARIOS.map((sc) => {
                    const isSelected = selectedScenario.id === sc.id;
                    return (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        key={sc.id}
                        onClick={() => setSelectedScenario(sc)}
                        className={cn(
                          "text-left p-5 rounded-xl border transition-colors duration-200 relative flex flex-col justify-between",
                          isSelected
                            ? "bg-white border-orange-200 shadow-[0_4px_20px_-4px_rgba(234,88,12,0.15)] ring-1 ring-orange-500/20"
                            : "bg-white/40 hover:bg-white border-slate-200/60 hover:border-slate-300 hover:shadow-sm"
                        )}
                      >
                        <div className="font-semibold text-slate-900 mb-1.5 leading-snug">{sc.name}</div>
                        <div className="text-[12px] text-slate-500 font-medium mb-4">
                          {sc.table} <span className="opacity-50">•</span> {sc.tableRows}
                        </div>
                        <div className="flex items-center justify-between text-[12px] w-full mt-auto pt-4 border-t border-slate-100/50">
                          <span className="text-slate-400 font-mono">{sc.baselineTimeMs}ms</span>
                          <span className="font-mono font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">+{sc.deltaMs}ms</span>
                        </div>
                        
                        {isSelected && (
                          <motion.div 
                            layoutId="scenario-outline"
                            className="absolute inset-0 border-2 border-orange-500/30 rounded-xl pointer-events-none"
                            initial={false}
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                          />
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                <AnimatePresence mode="wait">
                  <motion.div 
                    key={selectedScenario.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="text-[13px] text-slate-600 bg-white/50 p-4 rounded-xl border border-slate-100 shadow-inner"
                  >
                    <strong className="font-semibold text-slate-900">Pattern:</strong> {selectedScenario.description}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>

            {/* 2. Monthly Request Volume Slider */}
            <motion.div variants={itemVariants} className="bg-white/70 backdrop-blur-2xl rounded-2xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden transition-all duration-300 hover:shadow-[0_8px_40px_rgb(0,0,0,0.06)]">
              <div className="bg-white/40 border-b border-black/[0.04] px-6 py-5 flex items-center justify-between">
                <span className="text-[12px] font-semibold uppercase tracking-widest text-slate-600 flex items-center gap-2.5">
                  <span className="flex items-center justify-center size-6 rounded-full bg-orange-100 text-orange-600">
                    <Clock className="size-3.5" />
                  </span>
                  2. Execution Volume
                </span>
                <motion.span 
                  key={monthlyRequests}
                  initial={{ opacity: 0.5, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-[14px] font-semibold font-mono text-slate-900 bg-white px-3 py-1 rounded-lg shadow-sm border border-slate-100"
                >
                  {formatNumber(monthlyRequests)} req / mo
                </motion.span>
              </div>
              <div className="p-6 space-y-6">
                <div className="pt-2">
                  <Slider
                    value={[monthlyRequests]}
                    min={100_000}
                    max={50_000_000}
                    step={100_000}
                    onValueChange={(val) => {
                      const num = Array.isArray(val) ? val[0] : val;
                      setMonthlyRequests(num);
                    }}
                    className="w-full"
                  />
                </div>
                <div className="flex justify-between text-[11px] font-medium text-slate-400 px-1">
                  <span>Staging (100k)</span>
                  <span>Prod (5M)</span>
                  <span>Scale (25M)</span>
                  <span>Hyper (50M)</span>
                </div>
              </div>
            </motion.div>

            {/* 3. AWS RDS Instance Class */}
            <motion.div variants={itemVariants} className="bg-white/70 backdrop-blur-2xl rounded-2xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden transition-all duration-300 hover:shadow-[0_8px_40px_rgb(0,0,0,0.06)]">
              <div className="bg-white/40 border-b border-black/[0.04] px-6 py-5 flex items-center justify-between">
                <span className="text-[12px] font-semibold uppercase tracking-widest text-slate-600 flex items-center gap-2.5">
                  <span className="flex items-center justify-center size-6 rounded-full bg-orange-100 text-orange-600">
                    <Server className="size-3.5" />
                  </span>
                  3. Hardware Target
                </span>
                <span className="text-[11px] font-mono font-medium text-slate-500 bg-white/50 border border-slate-200/50 px-2.5 py-1 rounded-full">
                  us-east-1
                </span>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {INSTANCES.map((inst) => {
                    const isSelected = selectedInstance.id === inst.id;
                    return (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        key={inst.id}
                        onClick={() => setSelectedInstance(inst)}
                        className={cn(
                          "text-left p-5 rounded-xl border transition-colors duration-200 relative",
                          isSelected
                            ? "bg-white border-orange-200 shadow-[0_4px_20px_-4px_rgba(234,88,12,0.15)] ring-1 ring-orange-500/20"
                            : "bg-white/40 hover:bg-white border-slate-200/60 hover:border-slate-300 hover:shadow-sm"
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-slate-900 text-[13px]">{inst.name}</span>
                        </div>
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100/50">
                          <span className="text-slate-500 text-[11px] font-medium bg-slate-50 px-2 py-0.5 rounded">
                            {inst.vCpu} vCPU • {inst.ramGb} GB
                          </span>
                          <span className="font-mono text-slate-900 font-semibold text-[13px]">${inst.hourlyUsd}<span className="text-[10px] text-slate-400 font-sans">/hr</span></span>
                        </div>
                        
                        {isSelected && (
                          <motion.div 
                            layoutId="instance-outline"
                            className="absolute inset-0 border-2 border-orange-500/30 rounded-xl pointer-events-none"
                            initial={false}
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                          />
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Multi-AZ Toggle */}
                <div className="pt-6 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="font-semibold text-[14px] text-slate-900 block mb-1">Multi-AZ High Availability</span>
                    <span className="text-[12px] text-slate-500">Standby synchronous replica (2× compute cost)</span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsMultiAz(!isMultiAz)}
                    className={cn(
                      "px-4 py-2 rounded-xl border font-medium text-[13px] transition-colors flex items-center gap-2 shadow-sm",
                      isMultiAz
                        ? "bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <Settings2 className="size-4" />
                    {isMultiAz ? "Enabled (2× Cost)" : "Disabled (1× Cost)"}
                  </motion.button>
                </div>
              </div>
            </motion.div>

          </div>

          {/* RIGHT RESULTS: 5 Columns */}
          <motion.div variants={itemVariants} className="lg:col-span-5 space-y-6 relative">
            
            {/* Primary Impact Card - Floating Style */}
            <div className="bg-white/80 backdrop-blur-2xl rounded-3xl border border-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] overflow-hidden sticky top-24">
              <div className="p-8 space-y-8">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-semibold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <TrendingUp className="size-4 text-orange-500" />
                    Impact Projection
                  </span>
                  <span className="text-[11px] font-mono text-slate-400 bg-white/50 px-2 py-1 rounded-full border border-slate-100">Per PR</span>
                </div>

                <div className="text-center py-8 bg-gradient-to-b from-white to-slate-50/50 rounded-2xl border border-slate-100/50 shadow-inner relative overflow-hidden">
                  {/* Subtle inner glow */}
                  <motion.div 
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[100px] bg-orange-500/10 rounded-full blur-[40px]" 
                  />
                  
                  <div className="relative z-10">
                    <motion.div 
                      key={monthlyCostDelta}
                      initial={{ opacity: 0.5, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-5xl sm:text-6xl font-semibold font-mono text-slate-900 tracking-tighter mb-3"
                    >
                      +{formatCurrency(monthlyCostDelta)}
                    </motion.div>
                    <div className="text-[14px] text-slate-500 font-medium">
                      monthly cloud cost increase
                    </div>
                    <motion.div 
                      key={annualizedCostDelta}
                      initial={{ opacity: 0.5 }}
                      animate={{ opacity: 1 }}
                      className="mt-5 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50/50 border border-orange-200/60 text-orange-700 font-mono text-[12px] font-semibold"
                    >
                      <Sparkles className="size-3" />
                      +{formatCurrency(annualizedCostDelta)} / year
                    </motion.div>
                  </div>
                </div>

                {/* Granular Breakdown */}
                <div className="space-y-4 text-[14px] pt-4">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                    <span className="text-slate-500">Additional Compute Time:</span>
                    <motion.span 
                      key={monthlyComputeHours}
                      initial={{ opacity: 0.5 }} animate={{ opacity: 1 }}
                      className="font-mono font-semibold text-slate-900 bg-white px-2 py-1 rounded-md border border-slate-100 shadow-sm"
                    >
                      {formatNumber(Math.round(monthlyComputeHours))} hours / mo
                    </motion.span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                    <span className="text-slate-500">Baseline Execution:</span>
                    <motion.span 
                      key={selectedScenario.baselineTimeMs}
                      initial={{ opacity: 0.5 }} animate={{ opacity: 1 }}
                      className="font-mono text-slate-600"
                    >
                      {selectedScenario.baselineTimeMs} ms
                    </motion.span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                    <span className="text-slate-500">Candidate PR Execution:</span>
                    <motion.span 
                      key={selectedScenario.candidateTimeMs}
                      initial={{ opacity: 0.5, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                      className="font-mono text-orange-600 font-semibold bg-orange-50 px-2 py-1 rounded-md"
                    >
                      {selectedScenario.candidateTimeMs} ms
                    </motion.span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                    <span className="text-slate-500">Slowdown Factor:</span>
                    <motion.span 
                      key={selectedScenario.candidateTimeMs}
                      initial={{ opacity: 0.5 }} animate={{ opacity: 1 }}
                      className="font-mono text-red-600 font-semibold"
                    >
                      {(selectedScenario.candidateTimeMs / selectedScenario.baselineTimeMs).toFixed(1)}× slower
                    </motion.span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-slate-500">Carbon Impact:</span>
                    <motion.span 
                      key={carbonKgEstimate}
                      initial={{ opacity: 0.5 }} animate={{ opacity: 1 }}
                      className="font-mono text-emerald-700 flex items-center gap-1.5 font-semibold bg-emerald-50 px-2 py-1 rounded-md"
                    >
                      <Leaf className="size-3 text-emerald-600" />
                      ~{formatNumber(Math.round(carbonKgEstimate))} kg CO2e / mo
                    </motion.span>
                  </div>
                </div>

                {/* Action */}
                <div className="pt-6">
                  <Link href="/demo">
                    <motion.button
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-slate-900 text-white font-medium text-[14px] shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] transition-all"
                    >
                      <span>Fix this in PR Studio</span>
                      <ArrowRight className="size-4" />
                    </motion.button>
                  </Link>
                </div>
              </div>
              
              <div className="bg-slate-50/80 backdrop-blur-md border-t border-white/50 p-6">
                <h3 className="font-semibold text-slate-900 text-[13px] flex items-center gap-2 mb-3">
                  <HelpCircle className="size-4 text-orange-500" />
                  <span>Deterministic Modeling</span>
                </h3>
                <div className="font-mono text-[11px] text-slate-600 space-y-1.5 bg-white border border-slate-200/60 p-4 rounded-xl shadow-sm mb-4">
                  <div>Δ compute = (Δ runtime_ms / 1000) × queries / 3600</div>
                  <div>Δ cost = compute_hours × hourly_rate × HA_multiplier</div>
                </div>
                <p className="text-slate-500 text-[13px] leading-relaxed">
                  CostGate translates EXPLAIN ANALYZE plan deltas into verifiable monthly AWS RDS invoices.
                </p>
              </div>
            </div>
            
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
