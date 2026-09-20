"use client";

import React, { useState, useEffect } from "react";
import { Sliders, AlertTriangle, ShieldCheck, Check, Bell } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { formatCurrency } from "@/lib/formatters";
import { dashboardApi } from "@/lib/api/dashboard";
import { ErrorState } from "@/components/ui/error-state";

export function PolicySettings() {
  const [warnUsd, setWarnUsd] = useState<number>(5);
  const [blockUsd, setBlockUsd] = useState<number>(25);
  const [webhookUrl, setWebhookUrl] = useState<string>("https://discord.com/api/webhooks/1234/costgate-alerts");
  const [saved, setSaved] = useState<boolean>(false);
  const [error, setError] = useState<any | null>(null);

  const loadPolicy = async () => {
    setError(null);
    const res = await dashboardApi.getPolicy();
    if (res.error) {
      setError(res.error);
    } else if (res.data) {
      if (res.data.warn_usd) setWarnUsd(res.data.warn_usd);
      if (res.data.block_usd) setBlockUsd(res.data.block_usd);
      if (res.data.notification_webhook) setWebhookUrl(res.data.notification_webhook);
    }
  };

  useEffect(() => {
    loadPolicy();
  }, []);

  const handleSave = async () => {
    setSaved(false);
    setError(null);
    const res = await dashboardApi.updatePolicy({
      warn_usd: warnUsd,
      block_usd: blockUsd,
      notification_webhook: webhookUrl,
    });
    if (res.error) {
      setError(res.error);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-md p-5 shadow-xs space-y-5 max-w-2xl text-xs">
      <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
        <Sliders className="size-4 text-orange-600" />
        <h3 className="text-sm font-bold text-slate-900 tracking-tight">
          FinOps Threshold & Policy Configuration
        </h3>
      </div>

      {error && <ErrorState error={error} onRetry={loadPolicy} />}

      <div className="space-y-4">
        {/* Warning threshold */}
        <div className="p-3.5 rounded border border-slate-200 bg-slate-50 space-y-2">
          <div className="flex items-center justify-between">
            <label className="font-semibold text-slate-800 flex items-center gap-1.5">
              <AlertTriangle className="size-3.5 text-amber-600" /> Warning Comment Threshold
            </label>
            <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              +{formatCurrency(warnUsd)}/mo
            </span>
          </div>
          <Slider
            value={[warnUsd]}
            onValueChange={(val: any) => setWarnUsd(val[0])}
            min={1}
            max={50}
            step={1}
          />
        </div>

        {/* Blocking threshold */}
        <div className="p-3.5 rounded border border-slate-200 bg-slate-50 space-y-2">
          <div className="flex items-center justify-between">
            <label className="font-semibold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-rose-600" /> CI Check Failure Threshold
            </label>
            <span className="font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              +{formatCurrency(blockUsd)}/mo
            </span>
          </div>
          <Slider
            value={[blockUsd]}
            onValueChange={(val: any) => setBlockUsd(val[0])}
            min={10}
            max={200}
            step={5}
          />
        </div>

        {/* Webhook Alert URL */}
        <div className="p-3.5 rounded border border-slate-200 bg-slate-50 space-y-1.5">
          <label className="font-semibold text-slate-800 flex items-center gap-1.5">
            <Bell className="size-3.5 text-sky-600" /> Slack / Discord Alert Webhook URL
          </label>
          <input
            type="text"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            className="w-full p-2 bg-white border border-slate-200 rounded font-mono text-xs text-slate-800 focus:outline-none focus:border-slate-400"
          />
        </div>
      </div>

      <div className="pt-2 flex items-center justify-between">
        {saved ? (
          <span className="text-xs font-mono font-bold text-emerald-600 flex items-center gap-1">
            <Check className="size-4" /> Policy Saved
          </span>
        ) : (
          <span className="text-[11px] text-slate-500">
            Policy updates apply to incoming PR checks.
          </span>
        )}

        <button
          onClick={handleSave}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          Save Policy Configuration
        </button>
      </div>
    </div>
  );
}
