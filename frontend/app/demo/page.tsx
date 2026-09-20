"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  GitPullRequest, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Database, 
  Clock, 
  DollarSign, 
  Check, 
  ChevronRight, 
  Shield, 
  RefreshCw, 
  Copy,
  GitCommit,
  ArrowRight
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { LiveDashboard } from "@/components/live-dashboard";

interface SimulatedPR {
  id: string;
  number: number;
  title: string;
  branch: string;
  author: string;
  avatar: string;
  status: "failed" | "passed";
  costDelta: number;
  isSaving?: boolean;
  file: string;
  beforeQuery: string;
  afterQuery: string;
  fixedQuery: string;
  issueSummary: string;
  rootCause: string;
  beforePlan: { scanType: string; runtime: string; cost: string; };
  afterPlan: { scanType: string; runtime: string; cost: string; };
}

const SAMPLE_PRS: SimulatedPR[] = [
  {
    id: "pr-42",
    number: 42,
    title: "New feature: Search customers by email address",
    branch: "feature/customer-search",
    author: "alex-chen",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    status: "failed",
    costDelta: 1240.50,
    file: "app/models/customer.py",
    beforeQuery: "SELECT id, email, tier FROM customers WHERE tenant_id = 42 AND status = 'active';",
    afterQuery: "SELECT id, email, tier FROM customers WHERE LOWER(email) = 'user@acme.com' AND tenant_id = 42;",
    fixedQuery: "SELECT id, email, tier FROM customers WHERE email = 'user@acme.com' AND tenant_id = 42; -- Uses existing index",
    issueSummary: "Searching by email using LOWER() ignores the database index, causing a slow scan over 4.2 million records.",
    rootCause: "Using the LOWER() function prevents the database from using its fast lookup index, forcing it to read every row.",
    beforePlan: { scanType: "Fast Index Lookup", runtime: "0.412 ms", cost: "0.43..8.45" },
    afterPlan: { scanType: "Full Table Scan (4.2M rows)", runtime: "842.180 ms", cost: "0.00..84120.00" },
  },
  {
    id: "pr-88",
    number: 88,
    title: "Fix: Calculate monthly revenue for billing dashboard",
    branch: "fix/billing-dashboard",
    author: "sarah-dev",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
    status: "failed",
    costDelta: 2480.00,
    file: "services/billing/invoices.go",
    beforeQuery: "SELECT sum(amount_cents) FROM invoices WHERE customer_id = 9182 AND created_at >= '2026-01-01';",
    afterQuery: "SELECT sum(amount_cents) FROM invoices WHERE status != 'void' AND created_at >= '2026-01-01';",
    fixedQuery: "SELECT sum(amount_cents) FROM invoices WHERE status = 'paid' AND created_at >= '2026-01-01'; -- Uses partial index",
    issueSummary: "Checking for 'not void' forces the database to check every single row (12 million records).",
    rootCause: "Negative queries (like !=) cannot use indexes effectively, massively slowing down the system.",
    beforePlan: { scanType: "Indexed Heap Scan", runtime: "1.820 ms", cost: "12.40..340.00" },
    afterPlan: { scanType: "Parallel Full Scan (12M rows)", runtime: "1,420.500 ms", cost: "0.00..184200.00" },
  },
  {
    id: "pr-104",
    number: 104,
    title: "Optimization: Speed up recent orders dashboard",
    branch: "performance/orders-dashboard",
    author: "elena-data",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80",
    status: "passed",
    costDelta: -890.00,
    isSaving: true,
    file: "migrations/20260919_orders_covering_idx.sql",
    beforeQuery: "SELECT count(*) FROM orders WHERE created_at > NOW() - INTERVAL '30 days' AND status = 'completed';",
    afterQuery: "CREATE INDEX CONCURRENTLY idx_orders_created_status ON orders(created_at, status) INCLUDE (total_cents);",
    fixedQuery: "CREATE INDEX CONCURRENTLY idx_orders_created_status ON orders(created_at, status) INCLUDE (total_cents);",
    issueSummary: "Creates a highly efficient 'covering index' to instantly serve dashboard queries.",
    rootCause: "Avoids loading full rows into memory, returning results 25x faster directly from the index.",
    beforePlan: { scanType: "Indexed Heap Scan", runtime: "28.400 ms", cost: "240.00..2100.00" },
    afterPlan: { scanType: "Index Only Scan (Zero Heap)", runtime: "1.120 ms", cost: "0.42..45.00" },
  },
];

export default function DemoPage() {
  const [selectedPR, setSelectedPR] = useState<SimulatedPR>(SAMPLE_PRS[0]);
  const [appliedFix, setAppliedFix] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSelectPR = (pr: SimulatedPR) => {
    setSelectedPR(pr);
    setAppliedFix(false);
  };

  const handleApplyFix = () => {
    setAppliedFix(true);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentCostDelta = appliedFix ? 0 : selectedPR.costDelta;
  const isPassing = appliedFix || selectedPR.status === "passed";

  return (
    <div className="min-h-screen bg-[#fafafa] font-sans selection:bg-orange-100 selection:text-orange-900 pb-20">
      {/* Refined Header */}
      <div className="bg-white border-b border-black/[0.06] sticky top-0 z-10 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3 text-[13px] font-medium text-slate-500">
            <Link href="/" className="hover:text-slate-900 transition-colors">Home</Link>
            <ChevronRight className="size-3 text-slate-300" />
            <span className="text-slate-900 font-semibold flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-orange-500" />
              Interactive PR Studio
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/calculator"
              className="text-[13px] font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1"
            >
              Cost Simulator <ArrowRight className="size-3" />
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-10">
        <div className="mb-10 max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 mb-2">
            See CostGate in action.
          </h1>
          <p className="text-[15px] text-slate-500 leading-relaxed">
            Select a Pull Request to see how CostGate automatically profiles database queries, catches performance regressions, and suggests committable fixes.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT SIDEBAR: PR Selection List */}
          <div className="lg:col-span-4 space-y-2">
            <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-3 px-1">
              Sample Pull Requests
            </div>
            <div className="flex flex-col gap-2">
              {SAMPLE_PRS.map((pr) => {
                const isSelected = selectedPR.id === pr.id;
                return (
                  <button
                    key={pr.id}
                    onClick={() => handleSelectPR(pr)}
                    className={cn(
                      "text-left p-3.5 rounded-xl transition-all text-sm relative border group flex flex-col gap-2.5",
                      isSelected
                        ? "bg-white border-orange-500/30 shadow-[0_2px_12px_-4px_rgba(234,88,12,0.15)] ring-1 ring-orange-500/10"
                        : "bg-white/50 border-black/[0.06] hover:bg-white hover:border-black/[0.1] hover:shadow-sm"
                    )}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px]">
                        <GitPullRequest className="size-3.5" />
                        <span>#{pr.number}</span>
                      </div>
                      {pr.isSaving ? (
                        <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                          {formatCurrency(pr.costDelta)}/mo
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100">
                          +{formatCurrency(pr.costDelta)}/mo
                        </span>
                      )}
                    </div>
                    <div className={cn("font-medium leading-snug line-clamp-2", isSelected ? "text-slate-900" : "text-slate-700 group-hover:text-slate-900")}>
                      {pr.title}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 p-4 rounded-xl bg-white border border-black/[0.06] shadow-sm">
              <div className="flex items-center gap-2 text-slate-900 font-medium text-[13px] mb-1.5">
                <Shield className="size-4 text-orange-500" />
                Safe Testing
              </div>
              <p className="text-[12px] text-slate-500 leading-relaxed">
                CostGate executes queries in a secure shadow replica. Your production data is never modified.
              </p>
            </div>
          </div>

          {/* RIGHT MAIN: PR View Studio */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-2xl border border-black/[0.08] shadow-[0_4px_24px_-8px_rgba(0,0,0,0.05)] overflow-hidden">
              
              {/* PR Header */}
              <div className="p-5 sm:p-6 border-b border-black/[0.06] bg-slate-50/50">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <img src={selectedPR.avatar} alt={selectedPR.author} className="size-10 rounded-full border border-black/10 shadow-sm" />
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900 tracking-tight leading-tight">
                        {selectedPR.title} <span className="text-slate-400 font-normal font-mono text-base">#{selectedPR.number}</span>
                      </h2>
                      <div className="flex flex-wrap items-center gap-1.5 text-[13px] text-slate-500 mt-2">
                        <span className="font-semibold text-slate-900">{selectedPR.author}</span>
                        <span>wants to merge into</span>
                        <code className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono text-[11px] border border-black/[0.05]">main</code>
                        <span>from</span>
                        <code className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono text-[11px] border border-black/[0.05]">{selectedPR.branch}</code>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* PR Timeline Content */}
              <div className="p-5 sm:p-6 space-y-6">
                
                {/* Check Status */}
                <div className="flex items-center gap-3 p-3 rounded-lg border border-black/[0.06] bg-white shadow-sm">
                  <div className={cn("size-8 rounded-full flex items-center justify-center shrink-0", isPassing ? "bg-emerald-100" : "bg-red-100")}>
                    {isPassing ? <CheckCircle2 className="size-4 text-emerald-600" /> : <AlertTriangle className="size-4 text-red-600" />}
                  </div>
                  <div className="flex-1 text-[13px]">
                    <div className="font-semibold text-slate-900">
                      CostGate FinOps Guard
                    </div>
                    <div className="text-slate-500">
                      {isPassing ? "All queries passed performance budgets." : `Blocked due to +${formatCurrency(currentCostDelta)}/mo cost regression.`}
                    </div>
                  </div>
                </div>

                {/* Code Diff (GitHub Style) */}
                <div className="rounded-lg border border-black/[0.08] overflow-hidden shadow-sm">
                  <div className="bg-slate-50 px-4 py-2.5 border-b border-black/[0.08] flex items-center justify-between text-[12px]">
                    <div className="flex items-center gap-2 text-slate-700 font-medium">
                      <GitCommit className="size-3.5 text-slate-400" />
                      {selectedPR.file}
                    </div>
                    <button
                      onClick={() => handleCopy(appliedFix ? selectedPR.fixedQuery : selectedPR.afterQuery)}
                      className="text-slate-500 hover:text-slate-900 flex items-center gap-1.5 transition-colors font-medium"
                    >
                      <Copy className="size-3" />
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                  
                  <div className="font-mono text-[12px] leading-relaxed bg-white text-slate-800 overflow-x-auto">
                    <div className="flex text-slate-400 bg-slate-50/50 px-4 py-1.5 select-none border-b border-black/[0.04]">
                      @@ -1,4 +1,4 @@
                    </div>
                    
                    {appliedFix ? (
                      <div className="flex bg-emerald-50/50">
                        <div className="w-10 shrink-0 border-r border-emerald-100 text-right pr-2 py-1.5 text-emerald-300 select-none bg-emerald-50">+</div>
                        <div className="px-4 py-1.5 text-emerald-900 whitespace-pre-wrap flex-1 break-all">
                          {selectedPR.fixedQuery}
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex bg-red-50/50">
                          <div className="w-10 shrink-0 border-r border-red-100 text-right pr-2 py-1.5 text-red-300 select-none bg-red-50">-</div>
                          <div className="px-4 py-1.5 text-red-900 whitespace-pre-wrap flex-1 break-all line-through decoration-red-300/50">
                            {selectedPR.beforeQuery}
                          </div>
                        </div>
                        <div className="flex bg-emerald-50/50">
                          <div className="w-10 shrink-0 border-r border-emerald-100 text-right pr-2 py-1.5 text-emerald-300 select-none bg-emerald-50">+</div>
                          <div className="px-4 py-1.5 text-emerald-900 whitespace-pre-wrap flex-1 break-all">
                            {selectedPR.afterQuery}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* The Bot Comment */}
                <div className="flex gap-4">
                  <div className="size-8 shrink-0 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 p-[1px] shadow-sm relative z-10">
                    <div className="bg-white size-full rounded-full flex items-center justify-center">
                      <Database className="size-4 text-orange-500" />
                    </div>
                  </div>

                  <div className="flex-1 rounded-xl border border-black/[0.08] shadow-sm bg-white overflow-hidden relative">
                    {/* Bot Header */}
                    <div className="bg-slate-50 border-b border-black/[0.06] px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 text-[13px]">costgate</span>
                        <span className="text-[11px] font-medium text-slate-500 bg-slate-200/50 px-1.5 py-0.5 rounded border border-black/[0.05]">bot</span>
                        <span className="text-[12px] text-slate-500">left a review</span>
                      </div>
                    </div>

                    {/* Bot Body */}
                    <div className="p-4 sm:p-5 space-y-5 text-[13px]">
                      
                      {/* Summary */}
                      <div>
                        <h4 className="font-semibold text-slate-900 flex items-center gap-1.5 mb-1">
                          <AlertTriangle className={cn("size-4", isPassing ? "text-emerald-500" : "text-orange-500")} />
                          {isPassing ? "Performance Regressions Resolved" : "Performance Regression Detected"}
                        </h4>
                        <p className="text-slate-600 leading-relaxed">
                          {selectedPR.issueSummary}
                        </p>
                      </div>

                      {/* Micro-Metrics Bento */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3 rounded-lg border border-black/[0.06] bg-slate-50">
                          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Impact</div>
                          <div className={cn("text-base font-semibold", appliedFix ? "text-emerald-600" : (selectedPR.isSaving ? "text-slate-900" : "text-orange-600"))}>
                            {appliedFix ? "$0.00" : (selectedPR.isSaving ? formatCurrency(selectedPR.costDelta) : `+${formatCurrency(selectedPR.costDelta)}`)}
                            <span className="text-[11px] text-slate-500 font-normal">/mo</span>
                          </div>
                        </div>
                        <div className="p-3 rounded-lg border border-black/[0.06] bg-slate-50">
                          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Method</div>
                          <div className="text-[12px] font-mono font-medium text-slate-700 truncate">
                            {appliedFix ? selectedPR.beforePlan.scanType : selectedPR.afterPlan.scanType}
                          </div>
                        </div>
                        <div className="p-3 rounded-lg border border-black/[0.06] bg-slate-50">
                          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Execution</div>
                          <div className="text-[12px] font-mono font-medium text-slate-700">
                            {appliedFix ? selectedPR.beforePlan.runtime : selectedPR.afterPlan.runtime}
                          </div>
                        </div>
                        <div className="p-3 rounded-lg border border-black/[0.06] bg-slate-50">
                          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Compute</div>
                          <div className="text-[12px] font-mono font-medium text-slate-700">
                            {appliedFix ? selectedPR.beforePlan.cost : selectedPR.afterPlan.cost}
                          </div>
                        </div>
                      </div>

                      {/* Root Cause Note */}
                      <div className="text-[13px] text-slate-600 border-l-2 border-slate-200 pl-3">
                        <span className="font-semibold text-slate-900">Why this happened:</span> {selectedPR.rootCause}
                      </div>

                      {/* Fix Action Box */}
                      {!appliedFix && selectedPR.status === "failed" && (
                        <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50/50 overflow-hidden">
                          <div className="px-4 py-3 border-b border-orange-100 flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-orange-700 font-semibold text-[13px]">
                              <Sparkles className="size-4" />
                              Suggested Optimization
                            </div>
                          </div>
                          <div className="p-4 bg-white/50">
                            <div className="bg-white border border-black/[0.06] rounded p-3 font-mono text-[12px] text-slate-800 shadow-sm whitespace-pre-wrap break-all mb-4">
                              {selectedPR.fixedQuery}
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[12px] text-slate-500 font-medium">Applies automatically via PR comment.</span>
                              <button
                                onClick={handleApplyFix}
                                className="inline-flex items-center gap-1.5 h-8 px-4 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold text-[13px] shadow-[0_2px_8px_-2px_rgba(249,115,22,0.4)] transition-all active:scale-[0.98]"
                              >
                                Commit Fix
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {appliedFix && (
                        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-2 text-emerald-800 font-semibold text-[13px]">
                            <Check className="size-4 text-emerald-600" />
                            Fix applied! Cost regression neutralized.
                          </div>
                          <button
                            onClick={() => setAppliedFix(false)}
                            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-white border border-black/[0.06] text-slate-600 font-medium text-[12px] shadow-sm hover:bg-slate-50"
                          >
                            <RefreshCw className="size-3" />
                            Reset Demo
                          </button>
                        </div>
                      )}

                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Live Backend Telemetry Ledger Section */}
        <div className="mt-16">
          <LiveDashboard />
        </div>
      </div>
    </div>
  );
}
