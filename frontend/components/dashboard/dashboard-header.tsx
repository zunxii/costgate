"use client";

import React from "react";
import Link from "next/link";
import { GitBranch, Plus, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardHeaderProps {
  repos: any[];
  selectedRepoId: string;
  onSelectRepo: (id: string) => void;
  onRefresh: () => void;
  refreshing: boolean;
  backendOnline: boolean;
}

export function DashboardHeader({
  repos,
  selectedRepoId,
  onSelectRepo,
  onRefresh,
  refreshing,
  backendOnline,
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className={cn(
            "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium border",
            backendOnline
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-red-50 text-red-700 border-red-200"
          )}>
            <span className={cn("size-2 rounded-full", backendOnline ? "bg-emerald-500 animate-pulse" : "bg-red-500")} />
            {backendOnline ? "Backend Service Online" : "Backend Offline"}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Cloud Cost Governance Console
        </h1>
        <p className="text-xs text-slate-500 font-normal mt-0.5">
          Real-time PR cost predictions reconciled with AWS Cost & Usage Reports (CUR 2.0).
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Repo Selector */}
        {repos.length > 0 && (
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-xs">
            <GitBranch className="size-3.5 text-slate-400" />
            <select
              value={selectedRepoId}
              onChange={(e) => onSelectRepo(e.target.value)}
              className="text-xs font-mono font-medium text-slate-800 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="all">All Repositories ({repos.length})</option>
              {repos.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-md text-xs font-medium text-slate-700 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={cn("size-3.5", refreshing && "animate-spin")} />
          <span>Refresh</span>
        </button>
      </div>
    </div>
  );
}
