"use client";

import React, { useState, useEffect } from "react";
import { Sliders, AlertTriangle, ShieldCheck, Check, Bell } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { formatCurrency } from "@/lib/formatters";

export function PolicySettings() {
  const [warnUsd, setWarnUsd] = useState<number>(5);
  const [blockUsd, setBlockUsd] = useState<number>(25);
  const [webhookUrl, setWebhookUrl] = useState<string>("https://discord.com/api/webhooks/1234/costgate-alerts");
  const [saved, setSaved] = useState<boolean>(false);

  useEffect(() => {
    fetch("/api/dashboard/policy")
      .then((res) => res.json())
      .then((data) => {
        if (data.warn_usd) setWarnUsd(data.warn_usd);
        if (data.block_usd) setBlockUsd(data.block_usd);
        if (data.notification_webhook) setWebhookUrl(data.notification_webhook);
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaved(false);
    try {
      await fetch("/api/dashboard/policy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          warn_usd: warnUsd,
          block_usd: blockUsd,
          notification_webhook: webhookUrl,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-6 max-w-3xl">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
        <div className="size-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
          <Sliders className="size-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">
            FinOps Policy & Threshold Management
          </h3>
          <p className="text-xs text-slate-500 font-light">
            Update warning limits, CI check blocking thresholds, and alert notifications.
          </p>
        </div>
      </div>

      <div className="space-y-6 text-xs">
        {/* Warn threshold */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-3">
          <div className="flex items-center justify-between">
            <label className="font-semibold text-slate-800 flex items-center gap-1.5">
              <AlertTriangle className="size-4 text-amber-500" /> Warning Comment Limit
            </label>
            <span className="font-mono font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
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

        {/* Block threshold */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-3">
          <div className="flex items-center justify-between">
            <label className="font-semibold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-rose-500" /> CI Check Failure Limit
            </label>
            <span className="font-mono font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
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

        {/* Notification Webhook */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-2">
          <label className="font-semibold text-slate-800 flex items-center gap-1.5">
            <Bell className="size-4 text-sky-500" /> Slack / Discord Alert Webhook URL
          </label>
          <input
            type="text"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          />
        </div>
      </div>

      <div className="pt-2 flex items-center justify-between">
        {saved ? (
          <span className="text-xs font-mono font-bold text-emerald-600 flex items-center gap-1">
            <Check className="size-4" /> Policy Updated Successfully
          </span>
        ) : (
          <span className="text-xs text-slate-400 font-light">
            Changes apply instantly to incoming PR webhooks.
          </span>
        )}

        <button
          onClick={handleSave}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
        >
          Save Policy Changes
        </button>
      </div>
    </div>
  );
}
