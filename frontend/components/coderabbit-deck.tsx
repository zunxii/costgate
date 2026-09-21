"use client";

import { ArrowRight, Database, GitPullRequest, LockKeyhole, Network, ShieldCheck, Workflow } from "lucide-react";

const PIPELINE = [
  {
    title: "1. GitHub event",
    icon: GitPullRequest,
    detail: "GitHub sends a pull_request webhook. CostGate verifies X-Hub-Signature-256 and keeps the installation context.",
    artifact: "Webhook → authenticated event envelope",
  },
  {
    title: "2. Queue + processor",
    icon: Workflow,
    detail: "The webhook is buffered in Amazon SQS so the public endpoint is decoupled from database analysis work.",
    artifact: "SQS message → processor Lambda",
  },
  {
    title: "3. SQL extraction",
    icon: Database,
    detail: "The processor reads the PR through a GitHub App installation token and extracts supported changed SQL from the diff.",
    artifact: "baseline_sql + candidate_sql",
  },
  {
    title: "4. VPC analysis",
    icon: Network,
    detail: "The analysis Lambda runs EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) inside the configured VPC database environment using read-only transaction settings.",
    artifact: "Plan metrics + execution deltas",
  },
  {
    title: "5. Cost policy",
    icon: ShieldCheck,
    detail: "The cost engine attributes the execution delta to the configured workload and RDS pricing assumptions, then evaluates the warning/block policy.",
    artifact: "Monthly impact + confidence + verdict",
  },
  {
    title: "6. GitHub write-back",
    icon: LockKeyhole,
    detail: "The processor can publish a GitHub Check Run and PR comment, while the prediction ledger stores the result for the authenticated dashboard.",
    artifact: "Check Run + ledger record",
  },
];

export function CodeRabbitDeck() {
  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="text-xs font-mono font-bold tracking-widest text-orange-600 uppercase">Implemented pipeline</div>
          <div className="text-sm font-semibold text-slate-900 mt-1">The same services power PR Studio and webhook analysis.</div>
        </div>
        <div className="text-[11px] font-mono text-slate-500">SAM + Lambda + SQS + DynamoDB + VPC</div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 divide-y md:divide-y-0 md:divide-x lg:divide-y lg:divide-x-0 border-b border-slate-200">
        {PIPELINE.map((step) => {
          const Icon = step.icon;
          return (
            <article key={step.title} className="p-5 min-h-[205px] border-slate-200 lg:border-b lg:[&:nth-child(-n+3)]:border-b">
              <div className="size-9 rounded-lg bg-orange-50 border border-orange-100 text-orange-600 flex items-center justify-center">
                <Icon className="size-4" />
              </div>
              <h3 className="mt-4 text-sm font-bold text-slate-900">{step.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">{step.detail}</p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[10px] font-mono text-slate-600">
                <span>{step.artifact}</span>
                <ArrowRight className="size-3 text-orange-500" />
              </div>
            </article>
          );
        })}
      </div>

      <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-slate-900">Live product surfaces use this backend.</div>
          <p className="text-xs text-slate-500 mt-1">Dashboard, PR Studio, GitHub onboarding, and Cost Simulator are authenticated application flows.</p>
        </div>
        <a href="/architecture" className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-orange-200 hover:text-orange-600 transition-colors">
          Inspect architecture <ArrowRight className="ml-1.5 size-3.5" />
        </a>
      </div>
    </div>
  );
}
