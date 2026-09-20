"use client";

import React, { useState } from "react";
import { Search, CheckCircle2, Clock, Eye } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";

interface PRTableProps {
  predictions: any[];
  onSelectPrediction: (item: any) => void;
}

export function PRTable({ predictions, onSelectPrediction }: PRTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = predictions.filter((item) => {
    const matchesSearch =
      (item.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.author || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.repository || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(item.pull_request_number).includes(searchTerm);

    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "reconciled"
        ? item.status === "reconciled"
        : statusFilter === "monitoring"
        ? item.status === "monitoring"
        : statusFilter === "increase"
        ? item.direction === "increase"
        : statusFilter === "decrease"
        ? item.direction === "decrease"
        : true;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="w-full bg-white border border-slate-200 rounded-md p-4 space-y-3 shadow-xs">
      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="relative flex-1 max-w-sm">
          <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search PR, author, repository..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-sans text-slate-900 focus:outline-none focus:border-slate-400"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {[
            { id: "all", label: "All Records" },
            { id: "reconciled", label: "Reconciled" },
            { id: "monitoring", label: "Monitoring" },
            { id: "increase", label: "Cost Increases" },
            { id: "decrease", label: "Cost Savings" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={cn(
                "px-2.5 py-1 rounded text-xs font-mono font-medium transition-colors cursor-pointer border whitespace-nowrap",
                statusFilter === tab.id
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* PR Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 text-slate-500 font-mono uppercase text-[10px] tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-2.5 px-3">Pull Request</th>
              <th className="py-2.5 px-3">Author</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3 text-right">Predicted Impact</th>
              <th className="py-2.5 px-3 text-right">Actual Reconciled</th>
              <th className="py-2.5 px-3 text-right">Forecast Error</th>
              <th className="py-2.5 px-3 text-center">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400 font-mono text-xs">
                  No prediction records found matching query filters.
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr
                  key={item.prediction_id}
                  onClick={() => onSelectPrediction(item)}
                  className="hover:bg-slate-50 transition-colors cursor-pointer group"
                >
                  <td className="py-2.5 px-3 font-medium text-slate-900">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded text-[11px] border border-orange-200">
                        #{item.pull_request_number}
                      </span>
                      <span className="truncate max-w-xs font-semibold">
                        {item.title || `PR #${item.pull_request_number}`}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {item.repository}
                    </div>
                  </td>

                  <td className="py-2.5 px-3 font-mono text-slate-700">{item.author}</td>

                  <td className="py-2.5 px-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold border uppercase",
                        item.status === "reconciled"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : item.status === "monitoring"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-slate-100 text-slate-600 border-slate-200"
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

                  <td className="py-2.5 px-3 text-right font-mono font-bold">
                    <span
                      className={cn(
                        item.predicted_monthly_delta > 0
                          ? "text-rose-600"
                          : "text-emerald-600"
                      )}
                    >
                      {item.predicted_monthly_delta > 0 ? "+" : ""}
                      {formatCurrency(item.predicted_monthly_delta)}/mo
                    </span>
                  </td>

                  <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                    {item.actual_monthly_delta !== null
                      ? `${item.actual_monthly_delta > 0 ? "+" : ""}${formatCurrency(item.actual_monthly_delta)}/mo`
                      : "Pending"}
                  </td>

                  <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-600">
                    {item.actual_error_pct !== null
                      ? `${item.actual_error_pct.toFixed(2)}%`
                      : "Pending"}
                  </td>

                  <td className="py-2.5 px-3 text-center">
                    <button className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 group-hover:text-orange-600 transition-colors">
                      <Eye className="size-3.5" />
                      <span>View</span>
                    </button>
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
