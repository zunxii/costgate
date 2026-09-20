"use client";

import React from "react";
import { Check, X, ShieldAlert, Zap, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const COMPARISONS = [
  {
    feature: "Detection Timing",
    traditional: "After production deployment via Datadog/AWS CloudWatch alerts",
    costgate: "Directly in GitHub PR before merge",
    highlight: true,
  },
  {
    feature: "Execution Plan Inspection",
    traditional: "Manual DBA EXPLAIN run when database CPU hits 100%",
    costgate: "Automated EXPLAIN (ANALYZE, BUFFERS) on every PR",
    highlight: false,
  },
  {
    feature: "Cost Impact Attribution",
    traditional: "Surprise monthly AWS bill with unknown query root-causes",
    costgate: "Projected $/month delta with confidence bounds on PR",
    highlight: true,
  },
  {
    feature: "Memory & Cache Thrashing",
    traditional: "Invisible until buffer pool miss rate spikes in production",
    costgate: "Shared hit vs shared read block delta comparison",
    highlight: false,
  },
  {
    feature: "Remediation",
    traditional: "Emergency rollback or P0 patch during peak traffic",
    costgate: "Committable index migrations provided right inside PR comment",
    highlight: true,
  },
  {
    feature: "CI/CD Pipeline Overhead",
    traditional: "Heavy integration tests taking 20+ minutes",
    costgate: "Event-driven asynchronous SQS Lambda (<2s analysis)",
    highlight: false,
  },
];

export function ComparisonSection() {
  return (
    <section className="py-16 md:py-24 border-t border-white/[0.08] bg-[#0c1017]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-400 font-mono text-xs mb-3">
            Why Teams Need CostGate
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Manual PR Review vs. Continuous Cost Governance
          </h2>
          <p className="mt-3 text-neutral-400 text-sm sm:text-base">
            Human reviewers cannot eyeball a SQL change and predict whether Postgres will choose an Index Scan or a full table Seq Scan.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="overflow-hidden rounded-2xl border border-white/[0.1] bg-[#0d1117] shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#161b22] text-neutral-400 font-medium border-b border-white/[0.08]">
                <tr>
                  <th className="py-4 px-6 w-1/3">Capability</th>
                  <th className="py-4 px-6 w-1/3 text-neutral-400">
                    <span className="flex items-center gap-1.5 text-neutral-300">
                      <X className="size-4 text-red-400" />
                      Traditional Code Reviews
                    </span>
                  </th>
                  <th className="py-4 px-6 w-1/3 bg-emerald-500/[0.06] text-emerald-400 font-semibold border-l border-emerald-500/20">
                    <span className="flex items-center gap-1.5">
                      <Zap className="size-4 text-emerald-400" />
                      With CostGate
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] text-neutral-300">
                {COMPARISONS.map((item, idx) => (
                  <tr
                    key={idx}
                    className={`hover:bg-white/[0.02] transition-colors ${
                      item.highlight ? "bg-white/[0.01]" : ""
                    }`}
                  >
                    <td className="py-4 px-6 font-medium text-white">
                      {item.feature}
                    </td>
                    <td className="py-4 px-6 text-neutral-400">
                      {item.traditional}
                    </td>
                    <td className="py-4 px-6 bg-emerald-500/[0.04] text-emerald-300 font-medium border-l border-emerald-500/10">
                      {item.costgate}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
