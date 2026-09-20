"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Sliders, AlertTriangle, ShieldCheck, CheckCircle2, ArrowRight } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { formatCurrency } from "@/lib/formatters";

interface StepPolicyConfigProps {
  onComplete: (policy: { warnUsd: number; blockUsd: number; dbInstance: string }) => Promise<void> | void;
}

export function StepPolicyConfig({ onComplete }: StepPolicyConfigProps) {
  const [warnUsd, setWarnUsd] = useState<number>(5);
  const [blockUsd, setBlockUsd] = useState<number>(25);
  const [dbInstance, setDbInstance] = useState<string>("db.t4g.small");
  const [saving, setSaving] = useState<boolean>(false);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await onComplete({ warnUsd, blockUsd, dbInstance });
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/80 backdrop-blur-xl border border-white/80 rounded-3xl p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] max-w-xl mx-auto text-left"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="size-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
          <Sliders className="size-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Configure FinOps Thresholds
          </h2>
          <p className="text-xs text-slate-500 font-light">
            Set the thresholds CostGate will apply to the real PR analysis pipeline.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Warning Threshold Slider */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <AlertTriangle className="size-4 text-amber-500" /> Warning Comment Threshold
            </label>
            <span className="text-sm font-mono font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200">
              +{formatCurrency(warnUsd)}/mo
            </span>
          </div>
          <Slider
            value={[warnUsd]}
            onValueChange={(val: any) => setWarnUsd(val[0])}
            min={1}
            max={50}
            step={1}
            className="py-1"
          />
          <p className="text-[11px] text-slate-400 font-light">
            Post an informational warning comment on PRs exceeding this estimated monthly cost increase.
          </p>
        </div>

        {/* Blocking Threshold Slider */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-rose-500" /> CI Check Failure Threshold
            </label>
            <span className="text-sm font-mono font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-lg border border-rose-200">
              +{formatCurrency(blockUsd)}/mo
            </span>
          </div>
          <Slider
            value={[blockUsd]}
            onValueChange={(val: any) => setBlockUsd(val[0])}
            min={10}
            max={200}
            step={5}
            className="py-1"
          />
          <p className="text-[11px] text-slate-400 font-light">
            Mark GitHub Check Run as failed when queries introduce cost spikes above this limit.
          </p>
        </div>

        {/* RDS Target Instance */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-2">
          <label className="text-xs font-semibold text-slate-700 block">
            Target AWS RDS Instance Tier
          </label>
          <select
            value={dbInstance}
            onChange={(e) => setDbInstance(e.target.value)}
            className="w-full text-xs font-mono p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          >
            <option value="db.t4g.small">db.t4g.small — $0.04/hr ($28.80/mo baseline)</option>
            <option value="db.m6g.large">db.m6g.large — $0.13/hr ($93.60/mo baseline)</option>
            <option value="db.r6g.xlarge">db.r6g.xlarge — $0.52/hr ($374.40/mo baseline)</option>
            <option value="db.r6g.4xlarge">db.r6g.4xlarge — $2.08/hr ($1,497.60/mo baseline)</option>
          </select>
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={saving}
        className="w-full mt-8 py-3.5 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99] cursor-pointer disabled:opacity-50"
      >
        <span>{saving ? "Saving Policy..." : "Complete Setup & Open Console"}</span>
        <ArrowRight className="size-3.5" />
      </button>
    </motion.div>
  );
}
