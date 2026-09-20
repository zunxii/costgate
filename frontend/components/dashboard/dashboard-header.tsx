"use client";

import React from "react";
import Link from "next/link";
import { GitBranch, Plus, ShieldCheck, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardHeaderProps {
  repos: any[];
  selectedRepoId: string;
  onSelectRepo: (id: string) => void;
  onRefresh: () => void;
  refreshing: boolean;
}

export function DashboardHeader({
  repos,
  selectedRepoId,
  onSelectRepo,
  onRefresh,
  refreshing,
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-mono font-semibold border border-emerald-200">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            CostGate Production Console
          </span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          Cloud Cost Governance Dashboard
        </h1>
        <p className="text-sm text-slate-500 font-light mt-1">
          Monitor Pull Request query cost predictions, Athena CUR reconciliations, and team FinOps metrics.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Repo Selector Dropdown */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
          <GitBranch className="size-4 text-slate-400" />
          <select
            value={selectedRepoId}
            onChange={(e) => onSelectRepo(e.target.value)}
            className="text-xs font-mono font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
          >
            <option value="all">All Repositories ({repos.length})</option>
            {repos.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={cn("size-3.5", refreshing && "animate-spin")} />
          <span>Refresh</span>
        </button>

        <Link
          href="/onboarding"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
        >
          <Plus className="size-3.5" />
          <span>Connect Repository</span>
        </Link>
      </div>
    </div>
  );
}
