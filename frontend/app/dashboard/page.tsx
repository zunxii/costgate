"use client";

import React, { useState, useEffect } from "react";
import { 
  Activity, 
  TrendingUp, 
  ShieldCheck, 
  BarChart3, 
  Layers, 
  Users, 
  Sliders, 
  CheckCircle2 
} from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { RepoCard } from "@/components/dashboard/repo-card";
import { PRTable } from "@/components/dashboard/pr-table";
import { PRDetailModal } from "@/components/dashboard/pr-detail-modal";
import { TeamLeaderboard } from "@/components/dashboard/team-leaderboard";
import { PolicySettings } from "@/components/dashboard/policy-settings";
import { ErrorState } from "@/components/ui/error-state";
import { dashboardApi } from "@/lib/api/dashboard";
import { formatCurrency, formatNumber } from "@/lib/formatters";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const [summary, setSummary] = useState<any | null>(null);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [authors, setAuthors] = useState<any[]>([]);
  const [repos, setRepos] = useState<any[]>([]);
  const [selectedRepoId, setSelectedRepoId] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"prs" | "leaderboard" | "policy">("prs");
  const [selectedPrediction, setSelectedPrediction] = useState<any | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any | null>(null);

  const loadConsoleData = async () => {
    setLoading(true);
    setError(null);

    const [sumRes, predRes, authRes, repoRes] = await Promise.all([
      dashboardApi.getSummary(),
      dashboardApi.getPredictions(),
      dashboardApi.getAuthors(),
      dashboardApi.getRepos(),
    ]);

    const firstError = sumRes.error || predRes.error || authRes.error || repoRes.error;

    if (firstError) {
      setError(firstError);
    }

    if (sumRes.data) setSummary(sumRes.data);
    if (predRes.data) setPredictions(predRes.data);
    if (authRes.data) setAuthors(authRes.data);
    if (repoRes.data) setRepos(repoRes.data);

    setLoading(false);
  };

  useEffect(() => {
    loadConsoleData();
  }, []);

  const filteredPredictions =
    selectedRepoId === "all"
      ? predictions
      : predictions.filter((p) => {
          const repoObj = repos.find((r) => r.id === selectedRepoId);
          return repoObj ? p.repository === repoObj.name : true;
        });

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <DashboardHeader
          repos={repos}
          selectedRepoId={selectedRepoId}
          onSelectRepo={setSelectedRepoId}
          onRefresh={loadConsoleData}
          refreshing={loading}
          backendOnline={!error}
        />

        {/* Error Banner when Backend is Unavailable */}
        {error && (
          <ErrorState
            error={error}
            onRetry={loadConsoleData}
            title="CostGate Backend API Error"
          />
        )}

        {/* Connected Repos Summary Row */}
        {repos.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {repos.map((repo) => (
              <RepoCard
                key={repo.id}
                repo={repo}
                isSelected={selectedRepoId === repo.id}
                onSelect={() =>
                  setSelectedRepoId(selectedRepoId === repo.id ? "all" : repo.id)
                }
              />
            ))}
          </div>
        )}

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 rounded-md bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 text-[11px] font-mono font-medium uppercase">
              <span>Total PR Predictions</span>
              <Activity className="size-3.5 text-orange-600" />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-slate-900 font-mono">
                {summary ? formatNumber(summary.prediction_count) : "—"}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {summary ? `${summary.reconciled_count} post-merge reconciled` : "No data"}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-md bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 text-[11px] font-mono font-medium uppercase">
              <span>Predicted Monthly Impact</span>
              <TrendingUp className="size-3.5 text-amber-600" />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-slate-900 font-mono">
                {summary ? formatCurrency(summary.total_predicted_monthly) : "—"}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Pre-merge query estimate</div>
            </div>
          </div>

          <div className="p-4 rounded-md bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 text-[11px] font-mono font-medium uppercase">
              <span>Verified Actual Impact</span>
              <ShieldCheck className="size-3.5 text-emerald-600" />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-slate-900 font-mono">
                {summary ? formatCurrency(summary.total_verified_monthly) : "—"}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Post-merge Athena CUR 2.0</div>
            </div>
          </div>

          <div className="p-4 rounded-md bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 text-[11px] font-mono font-medium uppercase">
              <span>Mean Forecast Error</span>
              <BarChart3 className="size-3.5 text-sky-600" />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-slate-900 font-mono">
                {summary && summary.mean_error_pct !== null
                  ? `${summary.mean_error_pct.toFixed(2)}%`
                  : "—"}
              </div>
              <div className="text-[11px] text-emerald-600 mt-0.5 font-medium flex items-center gap-1">
                <CheckCircle2 className="size-3" />
                <span>Deterministic AST Engine</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab("prs")}
            className={cn(
              "px-3 py-1.5 rounded text-xs font-mono font-bold transition-colors cursor-pointer flex items-center gap-1.5 border",
              activeTab === "prs"
                ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            )}
          >
            <Layers className="size-3.5" />
            PR Prediction History ({filteredPredictions.length})
          </button>
          <button
            onClick={() => setActiveTab("leaderboard")}
            className={cn(
              "px-3 py-1.5 rounded text-xs font-mono font-bold transition-colors cursor-pointer flex items-center gap-1.5 border",
              activeTab === "leaderboard"
                ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            )}
          >
            <Users className="size-3.5" />
            Developer Rankings ({authors.length})
          </button>
          <button
            onClick={() => setActiveTab("policy")}
            className={cn(
              "px-3 py-1.5 rounded text-xs font-mono font-bold transition-colors cursor-pointer flex items-center gap-1.5 border",
              activeTab === "policy"
                ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            )}
          >
            <Sliders className="size-3.5" />
            Policy Settings
          </button>
        </div>

        {/* Tab View Content */}
        {activeTab === "prs" && (
          <PRTable
            predictions={filteredPredictions}
            onSelectPrediction={setSelectedPrediction}
          />
        )}

        {activeTab === "leaderboard" && (
          <TeamLeaderboard authors={authors} />
        )}

        {activeTab === "policy" && <PolicySettings />}
      </div>

      {/* PR Detail Modal Drawer */}
      <PRDetailModal
        prediction={selectedPrediction}
        onClose={() => setSelectedPrediction(null)}
      />
    </div>
  );
}
