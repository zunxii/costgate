"use client";

import React from "react";
import { Award, CheckCircle2, TrendingUp, Users } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

interface TeamLeaderboardProps {
  authors: any[];
}

export function TeamLeaderboard({ authors }: TeamLeaderboardProps) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Award className="size-5 text-orange-500" />
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">
            Developer Query Efficiency Leaderboard
          </h3>
        </div>
        <span className="text-xs text-slate-400 font-mono">
          Sorted by Total Predicted Impact
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-slate-200/60">
            <tr>
              <th className="py-3 px-4 rounded-l-xl">Developer</th>
              <th className="py-3 px-4 text-center">PRs Audited</th>
              <th className="py-3 px-4 text-right">Total Predicted Impact</th>
              <th className="py-3 px-4 text-right">Total Reconciled Verified</th>
              <th className="py-3 px-4 text-right rounded-r-xl">Mean Forecast Accuracy Error</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {authors.map((auth, index) => (
              <tr key={auth.author} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3.5 px-4 font-mono font-bold text-slate-900 flex items-center gap-2">
                  <span className="size-5 rounded-full bg-slate-100 text-slate-600 text-[10px] flex items-center justify-center font-mono">
                    #{index + 1}
                  </span>
                  <span>{auth.author}</span>
                </td>
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
    </div>
  );
}
