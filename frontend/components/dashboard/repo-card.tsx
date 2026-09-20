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
      className={`p-4 rounded-md border transition-all cursor-pointer bg-white text-xs flex flex-col justify-between ${
        isSelected
          ? "border-orange-600 ring-1 ring-orange-600/20 shadow-xs"
          : "border-slate-200 hover:border-slate-300 shadow-xs"
      }`}
    >
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900">
            <GitBranch className="size-3.5 text-orange-600" />
            <span>{repo.name}</span>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-semibold">
            <ShieldCheck className="size-3" />
            {repo.webhook_health}
          </span>
        </div>

        <div className="text-[11px] text-slate-500 flex items-center gap-1 mb-3">
          <Database className="size-3 text-slate-400" />
          <span>{repo.db_engine}</span>
        </div>
      </div>

      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase font-mono text-slate-400">PRs Audited</div>
          <div className="text-xs font-mono font-bold text-slate-900">{repo.prs_analyzed}</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase font-mono text-slate-400">Total Savings</div>
          <div className="text-xs font-mono font-bold text-emerald-600 flex items-center gap-0.5 justify-end">
            <TrendingDown className="size-3" />
            {formatCurrency(repo.total_savings_usd)}
          </div>
        </div>
      </div>
    </div>
  );
}
