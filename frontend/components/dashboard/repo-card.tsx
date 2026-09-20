"use client";

import React from "react";
import { GitBranch, Database, ShieldCheck, TrendingDown } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

interface RepoCardProps {
  repo: {
    id: string;
    name: string;
    status: string;
    prs_analyzed: number;
    total_savings_usd: number;
    webhook_health: string;
    db_engine: string;
    installed_at: string;
  };
  isSelected: boolean;
  onSelect: () => void;
}

export function RepoCard({ repo, isSelected, onSelect }: RepoCardProps) {
  return (
    <div
      onClick={onSelect}
      className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
        isSelected
          ? "bg-white border-orange-500/40 shadow-md ring-2 ring-orange-500/10"
          : "bg-white/70 border-slate-200/80 hover:bg-white hover:shadow-sm"
      }`}
    >
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <GitBranch className="size-4 text-orange-500" />
            <h3 className="text-sm font-bold text-slate-900 font-mono">
              {repo.name}
            </h3>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <ShieldCheck className="size-3" />
            {repo.webhook_health}
          </span>
        </div>

        <div className="text-[11px] text-slate-500 font-light flex items-center gap-1.5 mb-4">
          <Database className="size-3.5 text-slate-400" />
          <span>{repo.db_engine}</span>
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase font-mono text-slate-400 font-semibold">
            PRs Audited
          </div>
          <div className="text-sm font-bold text-slate-900 font-mono">
            {repo.prs_analyzed}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase font-mono text-slate-400 font-semibold">
            Total Savings
          </div>
          <div className="text-sm font-bold text-emerald-600 font-mono flex items-center gap-0.5 justify-end">
            <TrendingDown className="size-3.5" />
            {formatCurrency(repo.total_savings_usd)}
          </div>
        </div>
      </div>
    </div>
  );
}
