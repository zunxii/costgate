"use client";

import React from "react";
import { Award } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

interface TeamLeaderboardProps {
  authors: any[];
}

export function TeamLeaderboard({ authors }: TeamLeaderboardProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-md p-4 space-y-3 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Award className="size-4 text-orange-600" />
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Developer Query Efficiency Rankings
          </h3>
        </div>
        <span className="text-xs text-slate-400 font-mono">
          Sorted by Total Monthly Cost Impact
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 text-slate-500 font-mono uppercase text-[10px] tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-2.5 px-3">Developer</th>
              <th className="py-2.5 px-3 text-center">PRs Audited</th>
              <th className="py-2.5 px-3 text-right">Total Predicted Impact</th>
              <th className="py-2.5 px-3 text-right">Total Reconciled Verified</th>
              <th className="py-2.5 px-3 text-right">Forecast Error</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {authors.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400 font-mono text-xs">
                  No author metrics recorded yet.
                </td>
              </tr>
            ) : (
              authors.map((auth, index) => (
                <tr key={auth.author} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900 flex items-center gap-2">
                    <span className="size-4 rounded bg-slate-100 text-slate-600 text-[10px] flex items-center justify-center font-mono">
                      #{index + 1}
                    </span>
                    <span>{auth.author}</span>
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono">{auth.prs}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                    {formatCurrency(auth.predicted_monthly)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                    {formatCurrency(auth.verified_monthly)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-600">
                    {auth.mean_error_pct !== null ? `${auth.mean_error_pct.toFixed(2)}%` : "N/A"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
