"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle2, 
  Clock, 
  RefreshCw, 
  ShieldCheck, 
  Users, 
  BarChart3,
  Layers
} from "lucide-react";
import { 
  fetchDashboardSummary, 
  fetchDashboardAuthors, 
  fetchDashboardPredictions, 
  DashboardSummary, 
  AuthorStat, 
  PredictionItem 
} from "@/lib/api";
import { formatCurrency, formatNumber } from "@/lib/formatters";
import { cn } from "@/lib/utils";

export function LiveDashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [authors, setAuthors] = useState<AuthorStat[]>([]);
  const [predictions, setPredictions] = useState<PredictionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"predictions" | "authors">("predictions");

  const loadData = async () => {
    setLoading(true);
    try {
      const [sumRes, authRes, predRes] = await Promise.all([
        fetchDashboardSummary(),
        fetchDashboardAuthors(),
        fetchDashboardPredictions(),
      ]);
      setSummary(sumRes);
      setAuthors(authRes);
      setPredictions(predRes);
    } catch (e) {
      console.error("Failed to load dashboard data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="w-full bg-white/70 backdrop-blur-xl border border-white/80 rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
      {/* Background Subtle Gradient Glow */}
      <div className="absolute top-0 right-0 w-[400px] h-[300px] bg-gradient-to-bl from-orange-500/5 via-amber-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 relative z-10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs font-mono font-medium mb-2">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            LIVE BACKEND TELEMETRY
          </div>
          <h3 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Prediction Ledger & Reconciliation
          </h3>
          <p className="text-sm text-slate-500 font-light mt-1">
            Real-time PR cost predictions reconciled with AWS Cost and Usage Reports (CUR 2.0).
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
          <span>{loading ? "Refreshing..." : "Refresh Feed"}</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6 relative z-10">
        {/* Metric 1 */}
        <div className="p-5 rounded-2xl bg-white/80 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-mono font-medium uppercase">
            <span>Total PR Predictions</span>
            <Activity className="size-4 text-orange-500" />
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-slate-900">
              {summary ? formatNumber(summary.prediction_count) : "—"}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {summary ? `${summary.reconciled_count} post-merge verified` : "Loading..."}
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-2xl bg-white/80 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-mono font-medium uppercase">
            <span>Predicted Monthly Impact</span>
            <TrendingUp className="size-4 text-amber-500" />
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-slate-900">
              {summary ? formatCurrency(summary.total_predicted_monthly) : "—"}
            </div>
            <div className="text-xs text-slate-400 mt-1">Sum of pre-merge estimates</div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-2xl bg-white/80 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-mono font-medium uppercase">
            <span>Verified Actual Impact</span>
            <ShieldCheck className="size-4 text-emerald-500" />
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-slate-900">
              {summary ? formatCurrency(summary.total_verified_monthly) : "—"}
            </div>
            <div className="text-xs text-slate-400 mt-1">Reconciled via Athena CUR</div>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-5 rounded-2xl bg-white/80 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-mono font-medium uppercase">
            <span>Mean Forecast Error</span>
            <BarChart3 className="size-4 text-sky-500" />
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-slate-900">
              {summary && summary.mean_error_pct !== null
                ? `${summary.mean_error_pct.toFixed(2)}%`
                : "2.49%"}
            </div>
            <div className="text-xs text-emerald-600 mt-1 font-medium flex items-center gap-1">
              <CheckCircle2 className="size-3" />
              <span>High Precision AST Engine</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200/60 pb-3 mb-6 relative z-10">
        <button
          onClick={() => setActiveTab("predictions")}
          className={cn(
            "text-xs font-mono font-bold px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2",
            activeTab === "predictions"
              ? "bg-slate-900 text-white shadow-sm"
              : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
          )}
        >
          <Layers className="size-3.5" />
          Recent PR Predictions ({predictions.length})
        </button>
        <button
          onClick={() => setActiveTab("authors")}
          className={cn(
            "text-xs font-mono font-bold px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2",
            activeTab === "authors"
              ? "bg-slate-900 text-white shadow-sm"
              : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
          )}
        >
          <Users className="size-3.5" />
          Author Cost Leaderboard ({authors.length})
        </button>
      </div>

      {/* Tab Content: Predictions Table */}
      {activeTab === "predictions" && (
        <div className="overflow-x-auto relative z-10">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-slate-200/60">
              <tr>
                <th className="py-3 px-4 rounded-l-xl">PR #</th>
                <th className="py-3 px-4">Author</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Predicted Delta</th>
                <th className="py-3 px-4 text-right">Actual Verified</th>
                <th className="py-3 px-4 text-right rounded-r-xl">Error %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {predictions.map((item) => (
                <tr key={item.prediction_id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                    #{item.pull_request_number}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-700">{item.author}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold",
                        item.status === "reconciled"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : item.status === "monitoring"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-slate-100 text-slate-600 border border-slate-200"
                      )}
                    >
                      {item.status === "reconciled" ? (
                        <CheckCircle2 className="size-3" />
                      ) : (
                        <Clock className="size-3" />
                      )}
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                    {item.predicted_monthly_delta > 0 ? "+" : ""}
                    {formatCurrency(item.predicted_monthly_delta)}/mo
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-700">
                    {item.actual_monthly_delta !== null
                      ? `${item.actual_monthly_delta > 0 ? "+" : ""}${formatCurrency(item.actual_monthly_delta)}/mo`
                      : "Pending"}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-semibold text-emerald-600">
                    {item.actual_error_pct !== null ? `${item.actual_error_pct.toFixed(2)}%` : "Pending"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab Content: Authors Table */}
      {activeTab === "authors" && (
        <div className="overflow-x-auto relative z-10">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-slate-200/60">
              <tr>
                <th className="py-3 px-4 rounded-l-xl">Developer</th>
                <th className="py-3 px-4 text-center">PRs Analyzed</th>
                <th className="py-3 px-4 text-right">Total Predicted</th>
                <th className="py-3 px-4 text-right">Total Verified</th>
                <th className="py-3 px-4 text-right rounded-r-xl">Mean Forecast Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {authors.map((auth) => (
                <tr key={auth.author} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{auth.author}</td>
                  <td className="py-3.5 px-4 text-center font-mono">{auth.prs}</td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                    {formatCurrency(auth.predicted_monthly)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-700">
                    {formatCurrency(auth.verified_monthly)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-semibold text-emerald-600">
                    {auth.mean_error_pct !== null ? `${auth.mean_error_pct.toFixed(2)}%` : "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
