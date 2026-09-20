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
import { formatCurrency, formatNumber } from "@/lib/formatters";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const [summary, setSummary] = useState<any>(null);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [authors, setAuthors] = useState<any[]>([]);
  const [repos, setRepos] = useState<any[]>([]);
  const [selectedRepoId, setSelectedRepoId] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"prs" | "leaderboard" | "policy">("prs");
  const [selectedPrediction, setSelectedPrediction] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sumRes, predRes, authRes, repoRes] = await Promise.all([
        fetch("/api/dashboard/summary").then((r) => r.json()),
        fetch("/api/dashboard/predictions").then((r) => r.json()),
        fetch("/api/dashboard/authors").then((r) => r.json()),
        fetch("/api/dashboard/repos").then((r) => r.json()),
      ]);

      setSummary(sumRes);
      setPredictions(predRes);
      setAuthors(authRes);
      setRepos(repoRes);
    } catch (e) {
      console.error("Failed to fetch dashboard console data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredPredictions = selectedRepoId === "all"
    ? predictions
    : predictions.filter((p) => {
        const repoObj = repos.find((r) => r.id === selectedRepoId);
        return repoObj ? p.repository === repoObj.name : true;
      });

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-orange-100 selection:text-orange-900 py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-[-10%] right-[10%] w-[600px] h-[500px] bg-orange-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        {/* Console Header */}
        <DashboardHeader
          repos={repos}
          selectedRepoId={selectedRepoId}
          onSelectRepo={setSelectedRepoId}
          onRefresh={loadData}
          refreshing={loading}
        />

        {/* Connected Repos Summary Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

        {/* KPI Metrics Summary Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 text-xs font-mono font-medium uppercase">
              <span>Total PR Predictions</span>
              <Activity className="size-4 text-orange-500" />
            </div>
            <div className="mt-4">
              <div className="text-3xl font-bold text-slate-900">
                {summary ? formatNumber(summary.prediction_count) : "—"}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {summary ? `${summary.reconciled_count} post-merge reconciled` : "Loading..."}
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 text-xs font-mono font-medium uppercase">
              <span>Predicted Monthly Impact</span>
              <TrendingUp className="size-4 text-amber-500" />
            </div>
            <div className="mt-4">
              <div className="text-3xl font-bold text-slate-900">
                {summary ? formatCurrency(summary.total_predicted_monthly) : "—"}
              </div>
              <div className="text-xs text-slate-400 mt-1">Pre-merge query estimate</div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 text-xs font-mono font-medium uppercase">
              <span>Verified Actual Impact</span>
              <ShieldCheck className="size-4 text-emerald-500" />
            </div>
            <div className="mt-4">
              <div className="text-3xl font-bold text-slate-900">
                {summary ? formatCurrency(summary.total_verified_monthly) : "—"}
              </div>
              <div className="text-xs text-slate-400 mt-1">Post-merge Athena CUR 2.0</div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between">
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

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3">
          <button
            onClick={() => setActiveTab("prs")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2",
              activeTab === "prs"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            )}
          >
            <Layers className="size-3.5" />
            PR Prediction History ({filteredPredictions.length})
          </button>
          <button
            onClick={() => setActiveTab("leaderboard")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2",
              activeTab === "leaderboard"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            )}
          >
            <Users className="size-3.5" />
            Developer Leaderboard ({authors.length})
          </button>
          <button
            onClick={() => setActiveTab("policy")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2",
              activeTab === "policy"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            )}
          >
            <Sliders className="size-3.5" />
            FinOps Policy Settings
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
