"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  GitPullRequest, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  Copy, 
  Check, 
  Database,
  ArrowRight,
  ShieldAlert
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";

interface PRDetailModalProps {
  prediction: any | null;
  onClose: () => void;
}

export function PRDetailModal({ prediction, onClose }: PRDetailModalProps) {
  const [copied, setCopied] = useState(false);
  const [appliedFix, setAppliedFix] = useState(false);

  if (!prediction) return null;

  const isBlock = prediction.direction === "increase" && prediction.predicted_monthly_delta >= 25;
  const isWarn = prediction.direction === "increase" && prediction.predicted_monthly_delta >= 5;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Modal Header */}
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shrink-0 mt-0.5">
                <GitPullRequest className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-400">
                    {prediction.repository}
                  </span>
                  <span className="font-mono text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100">
                    #{prediction.pull_request_number}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
                  {prediction.title || `Pull Request #${prediction.pull_request_number}`}
                </h2>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-2 font-light">
                  <span>Author: <strong className="text-slate-700">{prediction.author}</strong></span>
                  <span>•</span>
                  <span>Status: <strong className="uppercase font-mono text-[11px] text-slate-700">{prediction.status}</strong></span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-600">
            {/* Impact Banner */}
            <div
              className={cn(
                "p-4 rounded-2xl border flex items-center justify-between",
                isBlock
                  ? "bg-rose-50 border-rose-200 text-rose-900"
                  : isWarn
                  ? "bg-amber-50 border-amber-200 text-amber-900"
                  : "bg-emerald-50 border-emerald-200 text-emerald-900"
              )}
            >
              <div className="flex items-center gap-3">
                {isBlock ? (
                  <ShieldAlert className="size-6 text-rose-600" />
                ) : isWarn ? (
                  <AlertTriangle className="size-6 text-amber-600" />
                ) : (
                  <CheckCircle2 className="size-6 text-emerald-600" />
                )}
                <div>
                  <div className="font-bold text-sm">
                    {isBlock
                      ? "High-Cost Regression (Check Blocked)"
                      : isWarn
                      ? "Cost Warning Threshold Exceeded"
                      : "Query Optimization Approved"}
                  </div>
                  <div className="text-[11px] opacity-80 mt-0.5">
                    Confidence: <strong className="uppercase font-mono">{prediction.confidence || "high"}</strong>
                  </div>
                </div>
              </div>

              <div className="text-right font-mono">
                <div className="text-2xl font-bold">
                  {prediction.predicted_monthly_delta > 0 ? "+" : ""}
                  {formatCurrency(prediction.predicted_monthly_delta)}/mo
                </div>
                <div className="text-[10px] opacity-75">Estimated AWS Bill Impact</div>
              </div>
            </div>

            {/* Execution Plan Metrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                <div className="text-[10px] font-mono text-slate-400 uppercase font-semibold">
                  AST Scan Method
                </div>
                <div className="text-xs font-mono font-bold text-slate-900 truncate mt-1">
                  {prediction.scan_type || "Full Table Scan (4.2M rows)"}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                <div className="text-[10px] font-mono text-slate-400 uppercase font-semibold">
                  Execution Latency
                </div>
                <div className="text-xs font-mono font-bold text-slate-900 mt-1">
                  {prediction.runtime || "842.18 ms"}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                <div className="text-[10px] font-mono text-slate-400 uppercase font-semibold">
                  Post-Merge Reconciliation
                </div>
                <div className="text-xs font-mono font-bold text-slate-900 mt-1">
                  {prediction.actual_monthly_delta !== null
                    ? `${formatCurrency(prediction.actual_monthly_delta)}/mo`
                    : "Pending ATHENA CUR"}
                </div>
              </div>
            </div>

            {/* SQL Diff Code Block */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 font-mono text-[11px]">
                  Detected SQL Delta (Unified Diff)
                </span>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900 text-slate-200 p-4 font-mono text-[11px] leading-relaxed overflow-x-auto space-y-2">
                <div className="text-slate-500 select-none">-- Before (Baseline Query)</div>
                <div className="text-rose-400 bg-rose-500/10 p-1.5 rounded">
                  - {prediction.before_query || "SELECT id, email FROM customers WHERE tenant_id = 42;"}
                </div>
                <div className="text-slate-500 select-none pt-2">-- After (Candidate PR Query)</div>
                <div className="text-amber-400 bg-amber-500/10 p-1.5 rounded">
                  + {prediction.after_query || "SELECT id, email FROM customers WHERE LOWER(email) = 'user@acme.com';"}
                </div>
              </div>
            </div>

            {/* Committable Fix Preview */}
            <div className="rounded-2xl border border-orange-200 bg-orange-50/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-orange-800 font-bold text-xs">
                  <Sparkles className="size-4 text-orange-500" />
                  CostGate Committable Fix Suggestion
                </div>
                <button
                  onClick={() => handleCopy(prediction.fixed_query || prediction.after_query)}
                  className="inline-flex items-center gap-1 text-[11px] text-orange-700 hover:text-orange-900 font-mono font-semibold"
                >
                  {copied ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                  <span>{copied ? "Copied" : "Copy Fix"}</span>
                </button>
              </div>

              <div className="bg-white border border-orange-200/80 rounded-xl p-3 font-mono text-[11px] text-slate-900 shadow-sm whitespace-pre-wrap">
                {prediction.fixed_query || "SELECT id, email FROM customers WHERE email = 'user@acme.com'; -- Uses B-Tree index"}
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Close Drawer
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
